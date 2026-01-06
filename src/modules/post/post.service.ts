import {
  COMMENT_STATUS,
  Post,
  POST_STATUS,
} from "../../../generated/prisma/client";
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../utils/AppError";

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

export const PostService = {
  createPost,
  getPosts,
  getPostById,
};
