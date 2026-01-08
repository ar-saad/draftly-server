import { Request, Response } from "express";
import { PostService } from "./post.service";
import { BadRequestError, UnauthorizedError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  POST_STATUS,
  USER_ROLES,
} from "../../../prisma/generated/prisma/enums";
import paginationSortingHelper from "../../utils/paginationSortingHelper";

// POST | "/api/v1/posts" | Create new post
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

// GET | "/api/v1/posts" | Get all posts
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

// GET | "/api/v1/posts/:postId" | Get post by id
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

// GET | "/api/v1/posts/my-posts" | Get own posts
const getMyPosts = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new BadRequestError("You are not authorized to perform this action");
  }

  const result = await PostService.getMyPosts(user?.id);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Posts retrieved successfully",
      data: result,
    },
    res
  );
});

// PATCH | "/api/v1/posts/:postId" | Update post by ID
const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = req.user;

  if (!postId) {
    throw new BadRequestError("Post ID not provided");
  }

  if (!user) {
    throw new BadRequestError("You are not authorized to perform this action");
  }

  const result = await PostService.updatePost(
    postId,
    user?.id,
    user?.role as USER_ROLES,
    req.body
  );

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Posts updated successfully",
      data: result,
    },
    res
  );
});

// DELETE | "/api/v1/posts/:postId" | Delete post by ID
const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const user = req.user;

  if (!postId) {
    throw new BadRequestError("Post ID not provided");
  }

  if (!user) {
    throw new BadRequestError("You are not authorized to perform this action");
  }

  const result = await PostService.deletePost(
    postId,
    user?.id,
    user?.role as USER_ROLES
  );

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Posts deleted successfully",
      data: result,
    },
    res
  );
});

// GET | "/api/v1/posts/stats" | Get post table statistics
const getStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await PostService.getStats();

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Post statistics retrieved successfully",
      data: result,
    },
    res
  );
});

export const PostController = {
  createPost,
  getPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getStats,
};
