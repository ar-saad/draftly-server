import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { CommentService } from "./comment.service";
import { sendResponse } from "../../utils/sendResponse";
import { BadRequestError } from "../../utils/AppError";

// POST | "/api/v1/comments" | Create comment
const createComment = asyncHandler(async (req: Request, res: Response) => {
  // Attach authorId to the body
  req.body.authorId = req.user?.id;
  const result = await CommentService.createComment(req.body);

  sendResponse(
    {
      statusCode: 201,
      success: true,
      message: "Comment created successfully",
      data: result,
    },
    res
  );
});

// GET | "/api/v1/comments/:commentId" | Get comment by Id
const getCommentById = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  if (!commentId || typeof commentId !== "string") {
    throw new BadRequestError("Comment ID not provided or invalid comment ID");
  }

  const result = await CommentService.getCommentById(commentId);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Comment retrieved successfully",
      data: result,
    },
    res
  );
});

// GET | "/api/v1/comments/author/:authorId" | Get comment by author or user Id
const getCommentByAuthorId = asyncHandler(
  async (req: Request, res: Response) => {
    const { authorId } = req.params;

    if (!authorId || typeof authorId !== "string") {
      throw new BadRequestError("Author ID not provided or invalid author ID");
    }

    const result = await CommentService.getCommentByAuthorId(authorId);

    sendResponse(
      {
        statusCode: 200,
        success: true,
        message: "Comments retrieved successfully",
        data: result,
      },
      res
    );
  }
);

// PATCH | "/api/v1/:commentId" | Update comment by Id
const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = req?.user;
  const authorId = user?.id;

  if (!commentId || typeof commentId !== "string") {
    throw new BadRequestError("Comment ID not provided or invalid comment ID");
  }

  if (!authorId || typeof authorId !== "string") {
    throw new BadRequestError("Author ID not provided or invalid author ID");
  }

  const result = await CommentService.updateComment(
    commentId,
    authorId,
    req.body
  );

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Comment updated successfully",
      data: result,
    },
    res
  );
});

// DELETE | "/api/v1/comments/:commentId" | Delete comment by Id
const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = req?.user;
  const authorId = user?.id;

  if (!commentId || typeof commentId !== "string") {
    throw new BadRequestError("Comment ID not provided or invalid comment ID");
  }

  if (!authorId || typeof authorId !== "string") {
    throw new BadRequestError("Author ID not provided or invalid author ID");
  }

  await CommentService.deleteComment(commentId, authorId);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Comment deleted successfully",
      data: [],
    },
    res
  );
});

// PATCH | "/api/v1/comments/moderate/:commentId" | Admin update comment status
const moderateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { status } = req.body;

  if (!commentId || typeof commentId !== "string") {
    throw new BadRequestError("Comment ID not provided or invalid comment ID");
  }

  const result = await CommentService.moderateComment(commentId, status);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Comment status updated successfully",
      data: result,
    },
    res
  );
});

export const CommentController = {
  createComment,
  getCommentById,
  getCommentByAuthorId,
  deleteComment,
  updateComment,
  moderateComment,
};
