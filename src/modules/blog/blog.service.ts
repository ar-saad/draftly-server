import {
  COMMENT_STATUS,
  Blog,
  BLOG_STATUS,
  USER_ROLES,
} from "../../../prisma/generated/prisma/client";
import { BlogWhereInput } from "../../../prisma/generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../utils/AppError";
import { omitUndefined } from "../../utils/object";

// POST | "/api/v1/blogs" | Create new blog
const createBlog = async (
  reqData: Omit<Blog, "id" | "createdAt" | "updatedAt" | "authorId">,
  userId: string,
) => {
  return await prisma.blog.create({
    data: {
      ...reqData,
      authorId: userId,
    },
  });
};

// GET | "/api/v1/blogs" | Get all blogs
const getBlogs = async (payload: {
  search: string | undefined;
  tagsArr: string[];
  isFeatured: boolean | undefined;
  status: BLOG_STATUS | undefined;
  authorId: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const {
    search,
    tagsArr,
    isFeatured,
    status,
    authorId,
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  } = payload;

  // AND query initialization
  const query: BlogWhereInput[] = [];

  // Check if search value exists
  if (search) {
    query.push({
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          tags: {
            has: search,
          },
        },
      ],
    });
  }

  // Check if tags search value exists
  if (tagsArr.length > 0) {
    query.push({
      tags: {
        hasEvery: tagsArr,
      },
    });
  }

  // Check if isFeatured exists
  if (typeof isFeatured === "boolean") {
    query.push({ isFeatured });
  }

  // Check if status exists
  if (status) {
    query.push({ status });
  }

  // Check if authorId exists
  if (authorId) {
    query.push({ authorId });
  }

  const blogs = await prisma.blog.findMany({
    take: limit,
    skip,
    where: {
      AND: query,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  const count = await prisma.blog.count({
    where: {
      AND: query,
    },
  });

  return {
    pagination: {
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
    result: blogs,
  };
};

// GET | "/api/v1/blogs/:blogId" | Get blog by id
const getBlogById = async (blogId: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.blog.update({
      where: {
        id: blogId,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    const blogData = await tx.blog.findUnique({
      where: {
        id: blogId,
      },
      include: {
        comments: {
          where: {
            parentId: null,
            status: COMMENT_STATUS.APPROVED,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            replies: {
              where: {
                status: COMMENT_STATUS.APPROVED,
              },
              orderBy: {
                createdAt: "asc",
              },
              include: {
                replies: {
                  where: {
                    status: COMMENT_STATUS.APPROVED,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!blogData) {
      throw new NotFoundError("Blog not found");
    }

    return blogData;
  });
};

// GET | "/api/v1/blogs/my-blogs" | Get own blogs
const getMyBlogs = async (authorId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: authorId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (user?.status !== "ACTIVE") {
    throw new ForbiddenError("Your account is not active or it is restricted");
  }

  const result = await prisma.blog.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  // const total = await prisma.blog.aggregate({
  //   _count: {
  //     id: true,
  //   },
  //   where: {
  //     authorId,
  //   },
  // });

  const total = await prisma.blog.count({
    where: {
      authorId,
    },
  });

  return {
    total,
    result,
  };
};

// PATCH | "/api/v1/blogs/:blogId" | Update blog by ID
const updateBlog = async (
  blogId: string,
  authorId: string,
  userRole: USER_ROLES,
  data: {
    title?: string;
    content?: string;
    thumbnail?: string;
    status?: BLOG_STATUS;
    tags?: string[];
    isFeatured?: boolean;
  },
) => {
  const blogToUpdate = await prisma.blog.findUnique({
    where: {
      id: blogId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  // Check if the blog exist
  if (!blogToUpdate) {
    throw new NotFoundError("Blog not found");
  }

  // Check if the user type is ADMIN,
  // check if the user is trying to update their own blog if he is not ADMIN
  if (userRole !== USER_ROLES.ADMIN && blogToUpdate.authorId !== authorId) {
    throw new ForbiddenError("You do not have permission to update this blog");
  }

  const payload = omitUndefined({
    title: data.title,
    content: data.content,
    thumbnail: data.thumbnail,
    status: data.status,
    tags: data.tags,
    ...(userRole === USER_ROLES.ADMIN ? { isFeatured: data.isFeatured } : {}),
  });

  return await prisma.blog.update({
    where: {
      id: blogId,
    },
    data: payload,
  });
};

// DELETE | "/api/v1/blogs/:blogId" | Delete blog by ID
const deleteBlog = async (
  blogId: string,
  userId: string,
  userRole: USER_ROLES,
) => {
  const blogToDelete = await prisma.blog.findUnique({
    where: {
      id: blogId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  // Check if the blog exist
  if (!blogToDelete) {
    throw new NotFoundError("Blog not found");
  }

  // Check if the user type is ADMIN,
  // If he is not ADMIN, check if the user is trying to delete their own blog or not
  if (userRole !== USER_ROLES.ADMIN && blogToDelete.authorId !== userId) {
    throw new ForbiddenError("You do not have permission to delete this blog");
  }

  return await prisma.blog.delete({
    where: {
      id: blogId,
    },
  });
};

// GET | "/api/v1/blogs/stats" | Get blog table statistics
const getStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      archivedBlogs,
      totalComments,
      approvedComments,
      rejectedComments,
      totalUsers,
      totalAdminCount,
      totalUserCount,
      totalViews,
    ] = await Promise.all([
      await tx.blog.count(),
      await tx.blog.count({ where: { status: BLOG_STATUS.PUBLISHED } }),
      await tx.blog.count({ where: { status: BLOG_STATUS.DRAFT } }),
      await tx.blog.count({ where: { status: BLOG_STATUS.ARCHIVED } }),
      await tx.comment.count(),
      await tx.comment.count({ where: { status: COMMENT_STATUS.APPROVED } }),
      await tx.comment.count({ where: { status: COMMENT_STATUS.REJECTED } }),
      await tx.user.count(),
      await tx.user.count({ where: { role: USER_ROLES.ADMIN } }),
      await tx.user.count({ where: { role: USER_ROLES.USER } }),
      await tx.blog.aggregate({ _sum: { views: true } }),
    ]);

    return {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      archivedBlogs,
      totalComments,
      approvedComments,
      rejectedComments,
      totalUsers,
      totalAdminCount,
      totalUserCount,
      totalViews: totalViews._sum.views,
    };
  });
};

export const BlogService = {
  createBlog,
  getBlogs,
  getBlogById,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  getStats,
};
