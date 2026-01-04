import { Request, Response } from "express";
import { PostService } from "./post.service";
import { BadRequestError, UnauthorizedError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { asyncHandler } from "../../utils/asynHandler";
import { POST_STATUS } from "../../../generated/prisma/enums";
import paginationSortingHelper from "../../utils/paginationSortingHelper";

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
  const { search, tags, isFeatured, status, authorId } = req.query;

  const statusString = typeof status === "string" ? status : undefined;

  const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper(
    req.query
  );

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
    page: page,
    limit: limit,
    skip: skip,
    sortBy: sortBy,
    sortOrder: sortOrder,
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

const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    throw new BadRequestError("Post ID not provided");
  }

  const result = await PostService.getPostById(postId);

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
  getPostById,
};
