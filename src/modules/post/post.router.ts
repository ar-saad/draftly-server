import { Router } from "express";
import { PostController } from "./post.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { USER_ROLES } from "../../../prisma/generated/prisma/enums";

const router: Router = Router();

// POST | "/api/v1/posts" | Create new post
router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.USER),
  PostController.createPost
);
// GET | "/api/v1/posts" | Get all posts
router.get("/", PostController.getPosts);
// GET | "/api/v1/posts/stats" | Get post table statistics
router.get(
  "/stats",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  PostController.getStats
);
// GET | "/api/v1/posts/my-posts" | Get own posts
router.get("/my-posts", authenticate, PostController.getMyPosts);
// GET | "/api/v1/posts/:postId" | Get post by id
router.get("/:postId", PostController.getPostById);
// PATCH | "/api/v1/posts/:postId" | Update post by ID
router.patch("/:postId", authenticate, PostController.updatePost);
// DELETE | "/api/v1/posts/:postId" | Delete post by ID
router.delete("/:postId", authenticate, PostController.deletePost);

export const PostRouter = router;
