import express, { Application, Request, Response } from "express";
import { PostRouter } from "./modules/post/post.router";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";

const app: Application = express();

// CORS config
app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5000",
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

// Parser
app.use(express.json());

// Routes
app.use("/api/v1/posts", PostRouter);

// ROOT DIRECTORY
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Draftly Blog App server!");
});

export default app;
