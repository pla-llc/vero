import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { createHono } from "./lib/hono";
import authRouter from "./routes/auth";

dotenv.config();

const app = createHono().basePath("/api").route("/auth", authRouter);

serve({
  fetch: app.fetch,
  port: 3001,
}).on("listening", () => {
  console.log("Server is running on port 3001");
});

export type AppType = typeof app;
