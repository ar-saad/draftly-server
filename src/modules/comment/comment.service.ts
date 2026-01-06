import { COMMENT_STATUS } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/AppError";

// POST | "/api/v1/comments" | Create comment
const createComment = async (payload: {
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
}) => {
  const { postId, parentId } = payload;
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: {
        id: parentId,
      },
    });

    if (!parentComment) {
      throw new NotFoundError("The comment author replying is to is not found");
    }
  }

  return await prisma.comment.create({
    data: payload,
  });
};

// GET | "/api/v1/comments/:commentId" | Get comment by Id
const getCommentById = async (commentId: string) => {
  const result = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      replies: {
        include: {
          replies: true,
        },
      },
      post: true,
    },
  });

  if (!result) {
    throw new NotFoundError("Comment not found");
  }

  return result;
};

// GET | "/api/v1/comments/author/:authorId" | Get comment by author or user Id
const getCommentByAuthorId = async (authorId: string) => {
  return await prisma.comment.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          views: true,
        },
      },
    },
  });
};

// PATCH | "/api/v1/:commentId" | Update comment by Id
const updateComment = async (
  commentId: string,
  authorId: string,
  data: {
    content?: string;
    status?: COMMENT_STATUS;
  }
) => {
  const { content, status } = data;

  // Must provide at least 1 field to update
  if (!content && !status) {
    throw new BadRequestError("Invalid request. No data provided.");
  }
  const commentData = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!commentData) {
    throw new NotFoundError("Comment not found");
  }

  if (commentData.authorId !== authorId) {
    throw new ForbiddenError(
      "You do not have permission to update this comment"
    );
  }

  const result = await prisma.comment.update({
    where: {
      id: commentId,
      authorId,
    },
    data,
  });

  if (!result) {
    throw new AppError(
      "There is an error. Could not update comment. Please try again later",
      500
    );
  }

  return result;
};

// DELETE | "/api/v1/comments/:commentId" | Delete comment by Id
const deleteComment = async (commentId: string, authorId: string) => {
  const commentData = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!commentData) {
    throw new NotFoundError("Comment not found");
  }

  if (commentData.authorId !== authorId) {
    throw new ForbiddenError(
      "You do not have permission to delete this comment"
    );
  }

  const result = await prisma.comment.delete({
    where: {
      id: commentId,
      authorId: authorId,
    },
  });

  if (!result) {
    throw new AppError(
      "There is an error. Could not delete comment. Please try again later",
      500
    );
  }

  return result;
};

export const CommentService = {
  createComment,
  getCommentById,
  getCommentByAuthorId,
  deleteComment,
  updateComment,
};
