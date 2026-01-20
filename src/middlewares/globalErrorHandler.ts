import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../prisma/generated/prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message =
      "Invalid request data. One or more required fields are missing or contain invalid values. Please review your input and try again.";
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      message =
        "An operation failed because it depends on one or more records that were required but not found.";
    }
    if (err.code === "P2002") {
      statusCode = 400;
      message = "Duplicate key error";
    }
    if (err.code === "P2003") {
      statusCode = 400;
      message = "Foreign key constraint failed";
    }
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = "Error occurred during query execution";
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      message = "Authentication failed. Please check your credentials!";
    } else if (err.errorCode === "P1001") {
      statusCode = 400;
      message = "Can't reach database";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.errors || err,
    ...(isDev && { stack: err.stack }),
  });
};
