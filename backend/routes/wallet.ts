import { cors } from "hono/cors";
import { createHono } from "../lib/hono";
import { WalletService } from "../lib/wallet";
import { auth } from "../lib/auth";

const app = createHono()
  .use("/*", cors({
    origin: "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }))
  
  // Get user's wallet info
  .get("/me", async (c) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.header() as any,
      });

      if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const wallet = await WalletService.getWalletForUser(session.user.id);
      if (!wallet) {
        return c.json({ error: "Wallet not found" }, 404);
      }

      // Don't send private key or mnemonic to frontend
      return c.json({
        publicKey: wallet.publicKey,
        isActivated: wallet.isActivated,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      });
    } catch (error) {
      console.error("Error getting wallet:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get wallet balance
  .get("/balance", async (c) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.header() as any,
      });

      if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const balance = await WalletService.getUserWalletBalance(session.user.id);
      return c.json({ balance });
    } catch (error) {
      console.error("Error getting balance:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default app;
