import { Router } from "express";
import { PostController } from "./post.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { USER_ROLES } from "../../../generated/prisma/enums";

const router: Router = Router();

router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.USER),
  PostController.createPost
);

export const PostRouter = router;
