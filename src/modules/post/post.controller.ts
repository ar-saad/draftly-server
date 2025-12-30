import { Request, Response } from "express";
import { PostService } from "./post.service";

const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await PostService.createPost(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "There is an error",
      data: error,
    });
  }
};

export const PostController = {
  createPost,
};
