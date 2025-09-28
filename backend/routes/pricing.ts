import { createHono } from "../lib/hono";
import { PriceService } from "../lib/price-service";

const app = createHono()
	// Get price for SOL token
	.get("/SOL", async (c) => {
		try {
			const tokenPrice = await PriceService.getTokenPrice("SOL");

			if (!tokenPrice) {
				return c.json({ error: "Could not fetch SOL price" }, 404);
			}

			return c.json(tokenPrice);
		} catch (error) {
			console.error("Error fetching SOL price:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	})

	// Get price for any token by symbol
	.get("/:symbol", async (c) => {
		try {
			const symbol = c.req.param("symbol");

			if (!symbol) {
				return c.json({ error: "Token symbol is required" }, 400);
			}

			const tokenPrice = await PriceService.getTokenPrice(symbol);

			if (!tokenPrice) {
				return c.json(
					{ error: `Could not fetch price for ${symbol}` },
					404
				);
			}

			return c.json(tokenPrice);
		} catch (error) {
			console.error(`Error fetching price for token:`, error);
			return c.json({ error: "Internal server error" }, 500);
		}
	});

export default app;
