import { Router } from "express";
import { PostController } from "./post.controller";

const router: Router = Router();

router.post("/", PostController.createPost);

export const PostRouter = router;
