import {
  COMMENT_STATUS,
  Post,
  POST_STATUS,
  USER_ROLES,
} from "../../../prisma/generated/prisma/client";
import { PostWhereInput } from "../../../prisma/generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../utils/AppError";
import { omitUndefined } from "../../utils/object";

// POST | "/api/v1/posts" | Create new post
const createPost = async (
  reqData: Omit<Post, "id" | "createdAt" | "updatedAt" | "authorId">,
  userId: string
) => {
  return await prisma.post.create({
    data: {
      ...reqData,
      authorId: userId,
    },
  });
};

// GET | "/api/v1/posts" | Get all posts
const getPosts = async (payload: {
  search: string | undefined;
  tagsArr: string[];
  isFeatured: boolean | undefined;
  status: POST_STATUS | undefined;
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
  const query: PostWhereInput[] = [];

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

  const posts = await prisma.post.findMany({
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

  const count = await prisma.post.count({
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
    result: posts,
  };
};

// GET | "/api/v1/posts/:postId" | Get post by id
const getPostById = async (postId: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: {
        id: postId,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    const postData = await tx.post.findUnique({
      where: {
        id: postId,
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

    if (!postData) {
      throw new NotFoundError("Post not found");
    }

    return postData;
  });
};

// GET | "/api/v1/posts/my-posts" | Get own posts
const getMyPosts = async (authorId: string) => {
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

  const result = await prisma.post.findMany({
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

  // const total = await prisma.post.aggregate({
  //   _count: {
  //     id: true,
  //   },
  //   where: {
  //     authorId,
  //   },
  // });

  const total = await prisma.post.count({
    where: {
      authorId,
    },
  });

  return {
    total,
    result,
  };
};

// PATCH | "/api/v1/posts/:postId" | Update post by ID
const updatePost = async (
  postId: string,
  authorId: string,
  userRole: USER_ROLES,
  data: {
    title?: string;
    content?: string;
    thumbnail?: string;
    status?: POST_STATUS;
    tags?: string[];
    isFeatured?: boolean;
  }
) => {
  const postToUpdate = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  // Check if the post exist
  if (!postToUpdate) {
    throw new NotFoundError("Post not found");
  }

  // Check if the user type is ADMIN,
  // check if the user is trying to update their own post if he is not ADMIN
  if (userRole !== USER_ROLES.ADMIN && postToUpdate.authorId !== authorId) {
    throw new ForbiddenError("You do not have permission to update this post");
  }

  const payload = omitUndefined({
    title: data.title,
    content: data.content,
    thumbnail: data.thumbnail,
    status: data.status,
    tags: data.tags,
    ...(userRole === USER_ROLES.ADMIN ? { isFeatured: data.isFeatured } : {}),
  });

  return await prisma.post.update({
    where: {
      id: postId,
    },
    data: payload,
  });
};

// DELETE | "/api/v1/posts/:postId" | Delete post by ID
const deletePost = async (
  postId: string,
  userId: string,
  userRole: USER_ROLES
) => {
  const postToDelete = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  // Check if the post exist
  if (!postToDelete) {
    throw new NotFoundError("Post not found");
  }

  // Check if the user type is ADMIN,
  // If he is not ADMIN, check if the user is trying to delete their own post or not
  if (userRole !== USER_ROLES.ADMIN && postToDelete.authorId !== userId) {
    throw new ForbiddenError("You do not have permission to delete this post");
  }

  return await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

// GET | "/api/v1/posts/stats" | Get post table statistics
const getStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalComments,
      approvedComments,
      rejectedComments,
      totalUsers,
      totalAdminCount,
      totalUserCount,
      totalViews,
    ] = await Promise.all([
      await tx.post.count(),
      await tx.post.count({ where: { status: POST_STATUS.PUBLISHED } }),
      await tx.post.count({ where: { status: POST_STATUS.DRAFT } }),
      await tx.post.count({ where: { status: POST_STATUS.ARCHIVED } }),
      await tx.comment.count(),
      await tx.comment.count({ where: { status: COMMENT_STATUS.APPROVED } }),
      await tx.comment.count({ where: { status: COMMENT_STATUS.REJECTED } }),
      await tx.user.count(),
      await tx.user.count({ where: { role: USER_ROLES.ADMIN } }),
      await tx.user.count({ where: { role: USER_ROLES.USER } }),
      await tx.post.aggregate({ _sum: { views: true } }),
    ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
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

export const PostService = {
  createPost,
  getPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getStats,
};
