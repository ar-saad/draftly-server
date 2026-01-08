import { Router } from "express";
import { CommentController } from "./comment.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { USER_ROLES } from "../../../generated/prisma/enums";

const router = Router();

// GET | "/api/v1/comments/:commentId" | Get comment by Id
router.get("/:commentId", CommentController.getCommentById);
// GET | "/api/v1/comments/author/:authorId" | Get comment by author or user Id
router.get("/author/:authorId", CommentController.getCommentByAuthorId);
// POST | "/api/v1/comments" | Create comment
router.post("/", authenticate, CommentController.createComment);
// PATCH | "/api/v1/:commentId" | Update comment by Id
router.patch("/:commentId", authenticate, CommentController.updateComment);
// DELETE | "/api/v1/comments/:commentId" | Delete comment by Id
router.delete("/:commentId", authenticate, CommentController.deleteComment);
// PATCH | "/api/v1/comments/moderate/:commentId" | Admin update comment status
router.patch(
  "/moderate/:commentId",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  CommentController.moderateComment
);

export const CommentRouter: Router = router;
