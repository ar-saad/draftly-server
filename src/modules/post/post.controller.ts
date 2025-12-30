import { Request, Response } from "express";
import { PostService } from "./post.service";
import { UnauthorizedError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { asyncHandler } from "../../utils/asynHandler";

const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("Unauthorized");

  const result = await PostService.createPost(req.body, req.user.id);

  sendResponse(
    {
      statusCode: 201,
      success: true,
      message: "Post created successfully",
      data: result,
    },
    res
  );
});

export const PostController = {
  createPost,
};
