import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono().get("/", (c) =>
  c.json({
    message: "Hello World",
  })
);

serve({
  fetch: app.fetch,
  port: 3001,
}).on("listening", () => {
  console.log("Server is running on port 3001");
});

export type AppType = typeof app;
