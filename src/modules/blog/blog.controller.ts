import { Request, Response } from "express";
import { BlogService } from "./blog.service";
import { BadRequestError, UnauthorizedError } from "../../utils/AppError";
import { sendResponse } from "../../utils/sendResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  BLOG_STATUS,
  USER_ROLES,
} from "../../../prisma/generated/prisma/enums";
import paginationSortingHelper from "../../utils/paginationSortingHelper";

// POST | "/api/v1/blogs" | Create new blog
const createBlog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError("Unauthorized");

  const result = await BlogService.createBlog(req.body, req.user.id);

  sendResponse(
    {
      statusCode: 201,
      success: true,
      message: "Blog created successfully",
      data: result,
    },
    res,
  );
});

// GET | "/api/v1/blogs" | Get all blogs
const getBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { search, tags, isFeatured, status, authorId } = req.query;

  const statusString = typeof status === "string" ? status : undefined;

  const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper(
    req.query,
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
    Object.values(BLOG_STATUS).includes(status as BLOG_STATUS)
      ? {
          status: statusString as BLOG_STATUS,
        }
      : { status: undefined }),
    authorId: authorId as string | undefined,
    page: page,
    limit: limit,
    skip: skip,
    sortBy: sortBy,
    sortOrder: sortOrder,
  };

  const result = await BlogService.getBlogs(payload);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Blog retrieved successfully",
      data: result,
    },
    res,
  );
});

// GET | "/api/v1/blogs/:blogId" | Get blog by id
const getBlogById = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;

  if (!blogId) {
    throw new BadRequestError("Blog ID not provided");
  }

  const result = await BlogService.getBlogById(blogId);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Blog retrieved successfully",
      data: result,
    },
    res,
  );
});

// GET | "/api/v1/blogs/my-blogs" | Get own blogs
const getMyBlogs = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new BadRequestError("You are not authorized to perform this action");
  }

  const result = await BlogService.getMyBlogs(user?.id);

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Blogs retrieved successfully",
      data: result,
    },
    res,
  );
});

// PATCH | "/api/v1/blogs/:blogId" | Update blog by ID
const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const user = req.user;

  if (!blogId) {
    throw new BadRequestError("Blog ID not provided");
  }

  if (!user) {
    throw new BadRequestError("You are not authorized to perform this action");
  }

  const result = await BlogService.updateBlog(
    blogId,
    user?.id,
    user?.role as USER_ROLES,
    req.body,
  );

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Blogs updated successfully",
      data: result,
    },
    res,
  );
});

// DELETE | "/api/v1/blogs/:blogId" | Delete blog by ID
const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const user = req.user;

  if (!blogId) {
    throw new BadRequestError("Blog ID not provided");
  }

  if (!user) {
    throw new BadRequestError("You are not authorized to perform this action");
  }

  const result = await BlogService.deleteBlog(
    blogId,
    user?.id,
    user?.role as USER_ROLES,
  );

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Blogs deleted successfully",
      data: result,
    },
    res,
  );
});

// GET | "/api/v1/blogs/stats" | Get blog table statistics
const getStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await BlogService.getStats();

  sendResponse(
    {
      statusCode: 200,
      success: true,
      message: "Blog statistics retrieved successfully",
      data: result,
    },
    res,
  );
});

export const BlogController = {
  createBlog,
  getBlogs,
  getBlogById,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  getStats,
};
