import { createHono } from "../lib/hono";
import { inngest } from "../inngest/inngest";
import { z } from "zod";

// Schema for token analysis request
const analysisRequestSchema = z.object({
	trendingLimit: z.number().min(0).max(50).optional().default(10),
	newListingsLimit: z.number().min(0).max(50).optional().default(10),
	analysisCount: z.number().min(1).max(20).optional().default(5),
});

const app = createHono()
	// Trigger token analysis workflow
	.post("/tokens/analyze", async (c) => {
		try {
			const body = await c.req.json();
			const validated = analysisRequestSchema.parse(body);

			// Trigger the Inngest workflow
			const event = await inngest.send({
				name: "token/analysis.requested",
				data: {
					trendingLimit: validated.trendingLimit,
					newListingsLimit: validated.newListingsLimit,
					analysisCount: validated.analysisCount,
					triggeredAt: new Date().toISOString(),
					triggeredBy: c.get("user")?.id || "anonymous",
				},
			});

			return c.json({
				success: true,
				message: "Token analysis workflow triggered successfully",
				eventId: event.ids[0],
				parameters: validated,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error triggering token analysis:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						success: false,
						error: "Invalid request parameters",
						details: error.issues,
					},
					400
				);
			}

			return c.json(
				{
					success: false,
					error: "Failed to trigger token analysis",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500
			);
		}
	})

	// Get analysis status/results (placeholder for future implementation)
	.get("/tokens/analyze/:eventId", async (c) => {
		const eventId = c.req.param("eventId");

		// This would typically query Inngest for the event status
		// For now, return a placeholder response
		return c.json({
			success: true,
			eventId,
			status: "processing", // would be: pending, processing, completed, failed
			message: "Analysis status endpoint - implementation pending",
			note: "This endpoint will be implemented to check workflow status",
		});
	})

	// Direct synchronous analysis endpoint (simplified version)
	.post("/tokens/analyze-sync", async (c) => {
		try {
			const body = await c.req.json();
			const validated = analysisRequestSchema.parse(body);

			// Import BirdEyeService for market data fetching
			const { BirdEyeService } = await import("../lib/birdeye");

			// Import tools for trending and new listings
			const { getTrendingTokensTool, getNewListingsTool } = await import(
				"../lib/mastra"
			);

			// Step 1: Fetch trending tokens
			console.log(
				`[Analysis Debug] Fetching trending tokens with limit: ${validated.trendingLimit}`
			);
			const trendingResult = await (getTrendingTokensTool as any).execute(
				{
					input: {
						limit: validated.trendingLimit,
						sort_by: "volume24hUSD",
					},
				}
			);
			console.log(
				`[Analysis Debug] Trending tokens result:`,
				JSON.stringify(trendingResult, null, 2)
			);

			// Step 2: Fetch new listings
			console.log(
				`[Analysis Debug] Fetching new listings with limit: ${validated.newListingsLimit}`
			);
			const newListingsResult = await (getNewListingsTool as any).execute(
				{
					input: {
						limit: validated.newListingsLimit,
					},
				}
			);
			console.log(
				`[Analysis Debug] New listings result:`,
				JSON.stringify(newListingsResult, null, 2)
			);

			if (!trendingResult.success && !newListingsResult.success) {
				return c.json(
					{
						success: false,
						error: "Failed to fetch both trending tokens and new listings",
					},
					500
				);
			}

			// Step 3: Combine tokens
			console.log(`[Analysis Debug] Processing token results...`);
			const trendingTokens = (trendingResult as any).success
				? (trendingResult as any).tokens
				: [];
			const newTokens = (newListingsResult as any).success
				? (newListingsResult as any).tokens
				: [];

			console.log(
				`[Analysis Debug] Trending tokens count: ${trendingTokens.length}`
			);
			console.log(
				`[Analysis Debug] New tokens count: ${newTokens.length}`
			);

			const allTokens = [...trendingTokens, ...newTokens];
			const uniqueTokens = allTokens.filter(
				(token, index, self) =>
					index === self.findIndex((t) => t.address === token.address)
			);

			console.log(
				`[Analysis Debug] Total unique tokens: ${uniqueTokens.length}`
			);
			console.log(`[Analysis Debug] Sample token:`, uniqueTokens[0]);

			// Limit to prevent timeout - analyze top 15 tokens
			const tokensToAnalyze = uniqueTokens.slice(0, 15);
			console.log(
				`[Analysis Debug] Tokens to analyze: ${tokensToAnalyze.length}`
			);

			// Step 4: Analyze each token
			const tokenAnalyses = [];

			for (const token of tokensToAnalyze) {
				try {
					// Fetch market data
					let marketDataResult: any;
					try {
						const apiResult =
							await BirdEyeService.getTokenMarketData(
								token.address
							);
						marketDataResult = {
							success: apiResult.success,
							data: apiResult.data || {},
							address: token.address,
						};
					} catch (apiError) {
						tokenAnalyses.push({
							token,
							analysisResult: {
								success: false,
								// @ts-ignore
								error: `API call failed: ${apiError.message}`,
								score: 0,
								recommendation: "UNKNOWN",
							},
						});
						continue;
					}

					// Add delay between requests to avoid rate limits (1.5 seconds)
					await new Promise((resolve) => setTimeout(resolve, 1500));

					const marketData = marketDataResult as any;

					if (
						!marketData.success ||
						!marketData.data ||
						marketData.data.price === undefined
					) {
						tokenAnalyses.push({
							token,
							analysisResult: {
								success: false,
								error: "No market data available",
								score: 0,
								recommendation: "UNKNOWN",
							},
						});
						continue;
					}

					// Analyze market data
					const { analyzeTokenMarketDataTool } = await import(
						"../lib/mastra"
					);
					const analysisResult = await (
						analyzeTokenMarketDataTool as any
					).execute({
						input: {
							marketData: marketData.data,
							token: token,
						},
					});

					tokenAnalyses.push({
						token,
						analysisResult,
					});
				} catch (error) {
					tokenAnalyses.push({
						token,
						analysisResult: {
							success: false,
							error:
								error instanceof Error
									? error.message
									: "Analysis failed",
							score: 0,
							recommendation: "UNKNOWN",
						},
					});
				}
			}

			// Step 5: Rank and select top tokens
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
				.slice(0, validated.analysisCount);

			const rankingData = {
				success: true,
				topTokens: scoredTokens,
				count: scoredTokens.length,
			};

			// Generate response
			const successfulAnalyses = tokenAnalyses.filter(
				(a: any) => a.analysisResult.success
			);
			const failedAnalyses = tokenAnalyses.filter(
				(a: any) => !a.analysisResult.success
			);

			return c.json({
				success: true,
				timestamp: new Date().toISOString(),
				summary: {
					totalTokensFetched: uniqueTokens.length,
					tokensAnalyzed: tokensToAnalyze.length,
					successfulAnalyses: successfulAnalyses.length,
					failedAnalyses: failedAnalyses.length,
					topTokensSelected: rankingData.success
						? rankingData.count
						: 0,
				},
				results: rankingData.success ? rankingData.topTokens : [],
				errors: failedAnalyses.map((a) => ({
					token: a.token.symbol || a.token.address,
					error: a.analysisResult.error,
				})),
				parameters: validated,
			});
		} catch (error) {
			console.error("Error in synchronous token analysis:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						success: false,
						error: "Invalid request parameters",
						details: error.issues,
					},
					400
				);
			}

			return c.json(
				{
					success: false,
					error: "Analysis failed",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				500
			);
		}
	})

	// Health check endpoint
	.get("/health", async (c) => {
		return c.json({
			success: true,
			service: "Token Analysis Service",
			timestamp: new Date().toISOString(),
			endpoints: {
				"POST /analyze": "Trigger async token analysis workflow",
				"GET /analyze/:eventId": "Check analysis status",
				"POST /analyze-sync": "Run synchronous token analysis",
				"GET /health": "Service health check",
			},
		});
	});

export default app;
