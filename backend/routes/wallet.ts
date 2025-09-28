import { cors } from "hono/cors";
import { createHono } from "../lib/hono";
import { WalletService, TOKENS } from "../lib/wallet";
import { auth } from "../lib/auth";
import agent from "../lib/token";

const app = createHono()
	.use(
		"/*",
		cors({
			origin: "http://localhost:3000",
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		})
	)

	.get("/top-gainers", async (c) => {
		try {
			const topGainers =
				await agent.agent.methods.getCoingeckoTopGainers();
			return c.json({ topGainers });
		} catch (error) {
			console.error("Error getting top gainers:", error);
			return c.json({ error: "Failed to get top gainers" }, 500);
		}
	})

	// Get user's wallet info
	.get("/me", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const wallet = await WalletService.getWalletForUser(
				session.user.id
			);
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

  .get('/private-key', async (c) => {
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

    return c.json({ privateKey: wallet.privateKey });
  } catch (error) {
    console.error("Error getting private key:", error);
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

			const balance = await WalletService.getUserWalletBalance(
				session.user.id
			);
			return c.json({ balance });
		} catch (error) {
			console.error("Error getting balance:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// Get available tokens with FARTCOIN
	.get("/tokens", async (c) => {
		return c.json({
			tokens: TOKENS,
			metadata: {
				SOL: { name: "Solana", symbol: "SOL", decimals: 9 },
				USDC: { name: "USD Coin", symbol: "USDC", decimals: 6 },
				USDT: { name: "Tether USD", symbol: "USDT", decimals: 6 },
				BONK: { name: "Bonk", symbol: "BONK", decimals: 5 },
				WIF: { name: "dogwifhat", symbol: "WIF", decimals: 6 },
				JUP: { name: "Jupiter", symbol: "JUP", decimals: 6 },
				FARTCOIN: { name: "Fartcoin", symbol: "FARTCOIN", decimals: 6 },
			},
		});
	})

	// Get token metadata for custom CA
	.get("/token/:address", async (c) => {
		try {
			const address = c.req.param("address");
			const metadata = await WalletService.getTokenMetadata(address);

			if (!metadata) {
				return c.json({ error: "Token not found" }, 404);
			}

			return c.json(metadata);
		} catch (error) {
			console.error("Error getting token metadata:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// Get token balance for specific token
	.get("/balance/:token", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const token = c.req.param("token").toUpperCase();
			let tokenMint = TOKENS[token as keyof typeof TOKENS];

			// If not in predefined tokens, treat as custom address
			if (!tokenMint) {
				tokenMint = c.req.param("token");
			}

			const balance = await WalletService.getTokenBalance(
				session.user.id,
				tokenMint
			);
			return c.json({ token, balance });
		} catch (error) {
			console.error("Error getting token balance:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// Get multiple token balances efficiently
	.post("/balances", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { tokens } = await c.req.json();

			const tokenMints = tokens.map((token: string) => {
				return (
					TOKENS[token.toUpperCase() as keyof typeof TOKENS] || token
				);
			});

			const balances = await WalletService.getMultipleTokenBalances(
				session.user.id,
				tokenMints
			);
			return c.json({ balances });
		} catch (error) {
			console.error("Error getting token balances:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// Get swap quote
	.post("/swap/quote", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { inputToken, outputToken, amount, slippage } =
				await c.req.json();

			let inputMint =
				TOKENS[inputToken.toUpperCase() as keyof typeof TOKENS];
			let outputMint =
				TOKENS[outputToken.toUpperCase() as keyof typeof TOKENS];

			// Handle custom token addresses
			if (!inputMint) inputMint = inputToken;
			if (!outputMint) outputMint = outputToken;

			const quote = await WalletService.getSwapQuote(
				inputMint,
				outputMint,
				amount,
				slippage || 50
			);

			return c.json(quote);
		} catch (error) {
			console.error("Error getting swap quote:", error);
			return c.json({ error: "Failed to get quote" }, 500);
		}
	})

	// Execute swap
	.post("/swap/execute", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { inputToken, outputToken, amount, slippage } =
				await c.req.json();

			let inputMint =
				TOKENS[inputToken.toUpperCase() as keyof typeof TOKENS];
			let outputMint =
				TOKENS[outputToken.toUpperCase() as keyof typeof TOKENS];

			// Handle custom token addresses
			if (!inputMint) inputMint = inputToken;
			if (!outputMint) outputMint = outputToken;

			const result = await WalletService.executeSwap(
				session.user.id,
				inputMint,
				outputMint,
				amount,
				slippage || 50
			);

			return c.json(result);
		} catch (error) {
			console.error("Error executing swap:", error);
			return c.json({ error: "Failed to execute swap" }, 500);
		}
	})

	// Get saved wallets
	.get("/saved-wallets", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const wallets = await WalletService.getSavedWallets(
				session.user.id
			);
			return c.json({ wallets });
		} catch (error) {
			console.error("Error getting saved wallets:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// Add saved wallet
	.post("/saved-wallets", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { label, address } = await c.req.json();
			const wallet = await WalletService.addSavedWallet(
				session.user.id,
				label,
				address
			);
			return c.json({ wallet });
		} catch (error: any) {
			console.error("Error adding saved wallet:", error);
			return c.json(
				{ error: error.message || "Failed to add wallet" },
				500
			);
		}
	})

	// Send tokens
	.post("/send", async (c) => {
		try {
			const session = await auth.api.getSession({
				headers: c.req.header() as any,
			});

			if (!session) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { toAddress, amount, token } = await c.req.json();
			const result = await WalletService.sendTokens(
				session.user.id,
				toAddress,
				token || "SOL",
				amount
			);
			return c.json(result);
		} catch (error) {
			console.error("Error sending tokens:", error);
			return c.json({ error: "Failed to send tokens" }, 500);
		}
	});

export default app;
