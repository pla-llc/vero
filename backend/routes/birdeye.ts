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
	});

export default app;
