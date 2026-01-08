import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { USER_ROLES } from "../../prisma/generated/prisma/enums";
import { asyncHandler } from "../utils/asyncHandler";
import { ForbiddenError, UnauthorizedError } from "../utils/AppError";

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get user session
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      throw new UnauthorizedError("You are not authorized");
    }

    if (!session.user.emailVerified) {
      throw new ForbiddenError(
        "Email verification required. Please verify your email!"
      );
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      role: session.user.role ?? USER_ROLES.USER,
    };

    next();
  }
);

export const authorize = (...roles: USER_ROLES[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError("You are not authorized");
    }

    if (roles.length && !roles.includes(req.user.role as USER_ROLES)) {
      throw new ForbiddenError(
        "You don't have permission to access this resource"
      );
    }

    next();
  };
};
