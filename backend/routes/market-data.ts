import { cors } from "hono/cors";
import { createHono } from "../lib/hono";
import { MarketDataService } from "../lib/market-data";

const app = createHono()
	.use(
		"/*",
		cors({
			origin: "http://localhost:3000",
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		})
	)

	// Get token price data for specific tokens
	.get("/prices", async (c) => {
		try {
			const { tokens } = c.req.query();

			if (tokens) {
				// If specific tokens are requested, parse them from comma-separated string
				const tokenAddresses = tokens.split(",");
				const priceData = await MarketDataService.getTokenPriceData(
					tokenAddresses
				);
				return c.json({ data: priceData });
			} else {
				// Return common token prices if no specific tokens requested
				const priceData =
					await MarketDataService.getCommonTokenPrices();
				return c.json({ data: priceData });
			}
		} catch (error) {
			console.error("Error getting token prices:", error);
			return c.json({ error: "Failed to fetch token prices" }, 500);
		}
	})

	// Get trending tokens
	.get("/trending/tokens", async (c) => {
		try {
			const trendingTokens = await MarketDataService.getTrendingTokens();
			return c.json({ data: trendingTokens });
		} catch (error) {
			console.error("Error getting trending tokens:", error);
			return c.json({ error: "Failed to fetch trending tokens" }, 500);
		}
	})

	// Get top gaining tokens
	.get("/trending/gainers", async (c) => {
		try {
			const { duration = "24h", limit = "10" } = c.req.query();
			const topGainers = await MarketDataService.getTopGainers(
				duration,
				limit
			);
			return c.json({ data: topGainers });
		} catch (error) {
			console.error("Error getting top gainers:", error);
			return c.json({ error: "Failed to fetch top gainers" }, 500);
		}
	})

	// Get latest pools
	.get("/pools/latest", async (c) => {
		try {
			const latestPools = await MarketDataService.getLatestPools();
			return c.json({ data: latestPools });
		} catch (error) {
			console.error("Error getting latest pools:", error);
			return c.json({ error: "Failed to fetch latest pools" }, 500);
		}
	})

	// Get trending pools
	.get("/pools/trending", async (c) => {
		try {
			const { duration = "24h" } = c.req.query();
			const trendingPools = await MarketDataService.getTrendingPools(
				duration
			);
			return c.json({ data: trendingPools });
		} catch (error) {
			console.error("Error getting trending pools:", error);
			return c.json({ error: "Failed to fetch trending pools" }, 500);
		}
	})

	// Get comprehensive market overview
	.get("/overview", async (c) => {
		try {
			const marketOverview = await MarketDataService.getMarketOverview();
			return c.json({ data: marketOverview });
		} catch (error) {
			console.error("Error getting market overview:", error);
			return c.json({ error: "Failed to fetch market overview" }, 500);
		}
	});

export default app;
