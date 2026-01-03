import { Request, Response } from "express";
import { PostService } from "./post.service";
import { UnauthorizedError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { asyncHandler } from "../../utils/asynHandler";
import { POST_STATUS } from "../../../generated/prisma/enums";

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

const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    tags,
    isFeatured,
    status,
    authorId,
    page,
    limit,
    sortBy,
    sortOrder,
  } = req.query;

  const statusString = typeof status === "string" ? status : undefined;

  // Pagination
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skipNumber = (pageNumber - 1) * limitNumber;

  const payload = {
    search: typeof search === "string" ? search : undefined,
    tagsArr: typeof tags === "string" ? tags.split(",") : [],
    ...(isFeatured === "true"
      ? { isFeatured: true }
      : isFeatured === "false"
      ? { isFeatured: false }
      : { isFeatured: undefined }),
    ...(statusString &&
    Object.values(POST_STATUS).includes(status as POST_STATUS)
      ? {
          status: statusString as POST_STATUS,
        }
      : { status: undefined }),
    authorId: authorId as string | undefined,
    page: pageNumber,
    take: limitNumber,
    skip: skipNumber,
    sortBy: sortBy as string | undefined,
    sortOrder: sortOrder as string | undefined,
  };

  const result = await PostService.getPosts(payload);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Post retrieved successfully",
      data: result,
    },
    res
  );
});

export const PostController = {
  createPost,
  getPosts,
};
