import { Router } from "express";
import { BlogController } from "./blog.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { USER_ROLES } from "../../../prisma/generated/prisma/enums";

const router: Router = Router();

// POST | "/api/v1/blogs" | Create new blog
router.post("/", authenticate, BlogController.createBlog);
// GET | "/api/v1/blogs" | Get all blogs
router.get("/", BlogController.getBlogs);
// GET | "/api/v1/blogs/stats" | Get blog table statistics
router.get(
  "/stats",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  BlogController.getStats,
);
// GET | "/api/v1/blogs/my-blogs" | Get own blogs
router.get("/my-blogs", authenticate, BlogController.getMyBlogs);
// GET | "/api/v1/blogs/:blogId" | Get blog by id
router.get("/:blogId", BlogController.getBlogById);
// PATCH | "/api/v1/blogs/:blogId" | Update blog by ID
router.patch("/:blogId", authenticate, BlogController.updateBlog);
// DELETE | "/api/v1/blogs/:blogId" | Delete blog by ID
router.delete("/:blogId", authenticate, BlogController.deleteBlog);

export const BlogRouter = router;
