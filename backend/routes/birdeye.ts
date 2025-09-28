import { createHono } from "../lib/hono";
import { BirdEyeService } from "../lib/birdeye";

const app = createHono()
	// Get trending tokens - replicates the curl request
	.get("/token_trending", async (c) => {
		try {
			const sort_by = c.req.query("sort_by") || "volume24hUSD";
			const sort_type = c.req.query("sort_type") || "asc";
			const offset = parseInt(c.req.query("offset") || "0");
			const limit = parseInt(c.req.query("limit") || "5");
			const ui_amount_mode = c.req.query("ui_amount_mode") || "scaled";

			// Validate sort_type
			if (sort_type !== "asc" && sort_type !== "desc") {
				return c.json(
					{ error: "Invalid sort_type. Must be 'asc' or 'desc'" },
					400
				);
			}

			// Validate offset and limit
			if (offset < 0) {
				return c.json({ error: "Offset must be non-negative" }, 400);
			}
			if (limit < 1 || limit > 100) {
				return c.json(
					{ error: "Limit must be between 1 and 100" },
					400
				);
			}

			const data = await BirdEyeService.getTrendingTokens({
				sort_by,
				sort_type,
				offset,
				limit,
				ui_amount_mode,
			});

			return c.json(data);
		} catch (error) {
			console.error("Error getting trending tokens:", error);
			return c.json({ error: "Failed to fetch trending tokens" }, 500);
		}
	})

	// Get new token listings - replicates the curl request
	.get("/new_listing", async (c) => {
		try {
			const limit = parseInt(c.req.query("limit") || "5");
			const meme_platform_enabled =
				c.req.query("meme_platform_enabled") !== "false"; // defaults to true

			// Validate limit
			if (limit < 1 || limit > 100) {
				return c.json(
					{ error: "Limit must be between 1 and 100" },
					400
				);
			}

			const data = await BirdEyeService.getNewListings({
				limit,
				meme_platform_enabled,
			});

			return c.json(data);
		} catch (error) {
			console.error("Error getting new listings:", error);
			return c.json({ error: "Failed to fetch new listings" }, 500);
		}
	})

	// Get Solana token info by address using DexScreener
	.get("/token/:address", async (c) => {
		try {
			const address = c.req.param("address");
			
			if (!address) {
				return c.json({ error: "Token address is required" }, 400);
			}

			// Use DexScreener API (free, no API key required)
			const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
			
			if (!response.ok) {
				throw new Error(`DexScreener API error: ${response.status}`);
			}

			const data = await response.json();
			
			if (!data.pairs || data.pairs.length === 0) {
				return c.json({ error: "Token not found" }, 404);
			}

			// Get the first Solana pair
			const solanaPair = data.pairs.find((pair: any) => pair.chainId === "solana") || data.pairs[0];
			
			// Return simplified token data
			return c.json({
				address: address,
				name: solanaPair.baseToken.name,
				symbol: solanaPair.baseToken.symbol,
				icon: solanaPair.info?.imageUrl || null,
				price: parseFloat(solanaPair.priceUsd) || 0
			});
			
		} catch (error) {
			console.error("Error getting token data:", error);
			return c.json({ error: "Failed to fetch token data" }, 500);
		}
	})

	// Search Solana tokens by query
	.get("/search/:query", async (c) => {
		try {
			const query = c.req.param("query");
			
			if (!query || query.length < 2) {
				return c.json({ error: "Search query must be at least 2 characters" }, 400);
			}

			// Use DexScreener search API
			const response = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(query)}`);
			
			if (!response.ok) {
				throw new Error(`DexScreener API error: ${response.status}`);
			}

			const data = await response.json();
			
			// Filter for Solana tokens only and return simplified results
			const solanaTokens = data.pairs
				?.filter((pair: any) => pair.chainId === "solana")
				?.slice(0, 10)
				?.map((pair: any) => ({
					address: pair.baseToken.address,
					name: pair.baseToken.name,
					symbol: pair.baseToken.symbol,
					icon: pair.info?.imageUrl || null,
					price: parseFloat(pair.priceUsd) || 0
				})) || [];
			
			return c.json({ tokens: solanaTokens });
			
		} catch (error) {
			console.error("Error searching tokens:", error);
			return c.json({ error: "Failed to search tokens" }, 500);
		}
	});

export default app;
