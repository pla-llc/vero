import { createTool } from "@mastra/core";
import { BirdEyeService } from "./birdeye";
import { z } from "zod";

// Tool for fetching trending tokens
export const getTrendingTokensTool = createTool({
	id: "get_trending_tokens",
	description: "Fetch trending tokens from BirdEye API",
	inputSchema: z.object({
		limit: z.number().optional().default(5),
		sort_by: z.string().optional().default("volume24hUSD"),
	}),
	execute: async (context: any) => {
		const { limit = 5, sort_by = "volume24hUSD" } = context.input;
		try {
			const data = await BirdEyeService.getTrendingTokens({
				limit,
				sort_by,
				sort_type: "desc",
			});
			return {
				success: true,
				tokens: data.data?.tokens || [],
				count: data.data?.tokens?.length || 0,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch trending tokens",
			};
		}
	},
});

// Tool for fetching new listings
export const getNewListingsTool = createTool({
	id: "get_new_listings",
	description: "Fetch new token listings from BirdEye API",
	inputSchema: z.object({
		limit: z.number().optional().default(5),
	}),
	execute: async (context: any) => {
		const { limit = 5 } = context.input;
		try {
			const data = await BirdEyeService.getNewListings({
				limit,
				meme_platform_enabled: true,
			});
			return {
				success: true,
				tokens: data.data?.items || [],
				count: data.data?.items?.length || 0,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch new listings",
			};
		}
	},
});

// Tool for fetching token market data
export const getTokenMarketDataTool = createTool({
	id: "get_token_market_data",
	description: "Fetch market data for a token from BirdEye API",
	inputSchema: z.object({
		address: z.string(),
	}),
	execute: async (context: any) => {
		const { address } = context.input;
		try {
			const data = await BirdEyeService.getTokenMarketData(address);

			if (!data.success) {
				return {
					success: false,
					error: "API returned unsuccessful response",
					address,
				};
			}

			return {
				success: true,
				data: data.data || {},
				address,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch market data",
				address,
			};
		}
	},
});

// Tool for analyzing token market data
export const analyzeTokenMarketDataTool = createTool({
	id: "analyze_token_market_data",
	description: "Analyze token market data to determine investment potential",
	inputSchema: z.object({
		marketData: z.any(),
		token: z.any(),
	}),
	execute: async (context: any) => {
		const { marketData, token } = context.input;
		try {
			if (!marketData) {
				throw new Error("No market data provided");
			}

			// Extract key metrics from market data
			const price = marketData.price || 0;
			const liquidity = marketData.liquidity || 0;
			const marketcap = marketData.market_cap || marketData.fdv || 0;
			const totalSupply = marketData.total_supply || 0;
			const circulatingSupply = marketData.circulating_supply || 0;

			// Calculate scoring metrics based on available data
			let score = 0;
			let analysis = "";

			// Liquidity strength (40% weight) - most important indicator
			if (liquidity > 1000000) {
				score += 40;
				analysis +=
					"Excellent liquidity indicates strong market depth. ";
			} else if (liquidity > 100000) {
				score += 30;
				analysis += "Good liquidity with solid market depth. ";
			} else if (liquidity > 10000) {
				score += 20;
				analysis += "Moderate liquidity. ";
			} else if (liquidity > 1000) {
				score += 10;
				analysis += "Low liquidity - higher risk. ";
			} else {
				score += 0;
				analysis += "Very low liquidity - very high risk. ";
			}

			// Market cap consideration (30% weight)
			if (marketcap > 10000000) {
				score += 30;
				analysis += "Large market cap indicates established token. ";
			} else if (marketcap > 1000000) {
				score += 20;
				analysis += "Medium market cap with growth potential. ";
			} else if (marketcap > 100000) {
				score += 15;
				analysis += "Small to medium cap - moderate risk/reward. ";
			} else if (marketcap > 10000) {
				score += 10;
				analysis += "Small cap - high risk/high reward potential. ";
			} else {
				score += 5;
				analysis += "Micro cap - very high risk. ";
			}

			// Price level consideration (20% weight)
			if (price > 1) {
				score += 20;
				analysis += "Higher price point suggests established value. ";
			} else if (price > 0.1) {
				score += 15;
				analysis += "Moderate price level. ";
			} else if (price > 0.01) {
				score += 10;
				analysis +=
					"Lower price - more accessible but potentially volatile. ";
			} else {
				score += 5;
				analysis += "Very low price - high volatility potential. ";
			}

			// Supply distribution (10% weight)
			const supplyRatio = circulatingSupply / totalSupply;
			if (supplyRatio > 0.8) {
				score += 10;
				analysis += "High circulating supply ratio. ";
			} else if (supplyRatio > 0.5) {
				score += 7;
				analysis += "Moderate circulating supply ratio. ";
			} else if (supplyRatio > 0.2) {
				score += 5;
				analysis += "Lower circulating supply ratio. ";
			} else {
				score += 2;
				analysis += "Very low circulating supply ratio. ";
			}

			// Determine recommendation
			let recommendation = "HOLD";
			if (score >= 80) {
				recommendation = "STRONG_BUY";
			} else if (score >= 60) {
				recommendation = "BUY";
			} else if (score >= 40) {
				recommendation = "WATCH";
			} else if (score >= 20) {
				recommendation = "AVOID";
			} else {
				recommendation = "SELL";
			}

			return {
				success: true,
				score,
				recommendation,
				analysis: analysis.trim(),
				metrics: {
					price,
					liquidity,
					marketcap,
					totalSupply,
					circulatingSupply,
					supplyRatio:
						totalSupply > 0 ? circulatingSupply / totalSupply : 0,
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to analyze market data",
				score: 0,
				recommendation: "UNKNOWN",
			};
		}
	},
});

// Tool for ranking tokens based on market data analysis
export const rankTokensTool = createTool({
	id: "rank_tokens",
	description:
		"Rank tokens based on market data analysis and select top performers",
	inputSchema: z.object({
		tokenAnalyses: z.array(z.any()),
		limit: z.number().optional().default(5),
	}),
	execute: async (context: any) => {
		const { tokenAnalyses, limit = 5 } = context.input;
		try {
			// Filter successful analyses and sort by score
			const scoredTokens = tokenAnalyses
				.filter((analysis: any) => analysis.analysisResult?.success)
				.map((analysis: any) => ({
					token: analysis.token,
					score: analysis.analysisResult.score,
					recommendation: analysis.analysisResult.recommendation,
					analysis: analysis.analysisResult.analysis,
					metrics: analysis.analysisResult.metrics,
				}))
				.sort((a: any, b: any) => b.score - a.score)
				.slice(0, limit);

			return {
				success: true,
				topTokens: scoredTokens,
				count: scoredTokens.length,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to rank tokens",
			};
		}
	},
});

// Export all tools
export const mastraTools = [
	getTrendingTokensTool,
	getNewListingsTool,
	getTokenMarketDataTool,
	analyzeTokenMarketDataTool,
	rankTokensTool,
];
