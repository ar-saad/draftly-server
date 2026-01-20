import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../prisma/generated/prisma/client";
import { log } from "../utils/logger";
import { AppError } from "../utils/AppError";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isDev = process.env.NODE_ENV === "development";

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  /**
   * Prisma error handling
   */
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message =
      "Invalid request data. One or more required fields are missing or contain invalid values.";
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      message = "Required record not found.";
    }

    if (err.code === "P2002") {
      statusCode = 400;
      message = "Duplicate key error.";
    }

    if (err.code === "P2003") {
      statusCode = 400;
      message = "Foreign key constraint failed.";
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = "Database connection failed.";
  }

  /**
   * Decide log level
   */
  const isOperational =
    err instanceof AppError ||
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError;

  const logLevel = isOperational ? "warn" : "error";

  /**
   * Centralized logging
   */
  log(logLevel, "Request failed", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: err.name,
    errorMessage: err.message,
    prismaCode: err.code || err.errorCode,
    stack: !isOperational && isDev ? err.stack : undefined,
  });

  /**
   * Response
   */
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && isOperational && { details: err.message }),
    ...(isDev && !isOperational && { stack: err.stack }),
  });
};
