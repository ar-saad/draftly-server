import { Router } from "express";
import { PostController } from "./post.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { USER_ROLES } from "../../../generated/prisma/enums";

const router: Router = Router();

// GET | "/api/v1/posts" | Get all posts
router.get("/", PostController.getPosts);
// GET | "/api/v1/post/:userId" | Get post by id
router.get("/:postId", PostController.getPostById);
// POST | "/api/v1/posts" | Create new post
router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.USER),
  PostController.createPost
);

export const PostRouter = router;
