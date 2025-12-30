import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDev = process.env.NODE_ENV === "development";
  const isOperational = err instanceof AppError;

  if (!isOperational) {
    console.error("🔥 Unexpected error:", err);
  }

  const statusCode = isOperational ? err.statusCode : 500;
  const message = isOperational ? err.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(isDev && { stack: err.stack }),
  });
};
