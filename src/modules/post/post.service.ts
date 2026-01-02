import { Post, POST_STATUS } from "../../../generated/prisma/client";
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

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
}) => {
  const { search, tagsArr, isFeatured, status, authorId } = payload;

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

  return await prisma.post.findMany({
    where: {
      AND: query,
    },
  });
};

export const PostService = {
  createPost,
  getPosts,
};
