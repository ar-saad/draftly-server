import express, { Application, Request, Response } from "express";
import { PostRouter } from "./modules/post/post.router";

const app: Application = express();

// Parser
app.use(express.json());

// Routes
app.use("/api/v1/posts", PostRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello Word!");
});

export default app;
