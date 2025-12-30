import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import { USER_ROLES } from "../../generated/prisma/enums";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get user session
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "You are not authenticated",
    });
  }

  if (!session.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required. Please verify your email!",
    });
  }

  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    role: session.user.role ?? USER_ROLES.USER,
  };

  next();
};

export const authorize = (...roles: USER_ROLES[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (roles.length && !roles.includes(req.user.role as USER_ROLES)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource",
      });
    }

    next();
  };
};
