import express, { Application, Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { PostRouter } from "./modules/post/post.router";
import { CommentRouter } from "./modules/comment/comment.router";
import { requestLogger } from "./middlewares/requestLogger";

const app: Application = express();

// CORS config
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Parser
app.use(express.json());
// Logger
app.use(requestLogger);

// Routes
app.all("/api/auth/*splat", toNodeHandler(auth)); // Auth route
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1/comments", CommentRouter);

// ROOT DIRECTORY
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Draftly Blog App server!");
});

// API Route not found
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
