import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import {
	getTrendingTokensTool,
	getNewListingsTool,
	getTokenMarketDataTool,
	analyzeTokenMarketDataTool,
	rankTokensTool,
} from "./mastra";

// Trading Analysis Agent
export const tradingAnalysisAgent = new Agent({
	name: "TradingAnalysisAgent",
	instructions: `You are a sophisticated trading analysis agent specialized in cryptocurrency token analysis.

Your primary responsibilities:
1. Fetch trending tokens and new listings from the market
2. Retrieve market data for each token
3. Calculate Exponential Moving Averages (EMA) to identify trends
4. Rank tokens based on technical analysis
5. Select the top 5 performing tokens based on your analysis

Analysis Criteria:
- Use market data to identify trends
- Prioritize tokens with bullish trends (current EMA > previous EMA)
- Consider momentum (rate of EMA change)
- Factor in trading volume when available
- Focus on tokens with sufficient historical data for accurate analysis

Always provide detailed reasoning for your token selections and include:
- Market data values and trends
- Momentum calculations
- Risk assessment
- Confidence levels for each recommendation

Be thorough in your analysis but concise in your recommendations.`,
	model: openai("gpt-4"),
	tools: {
		get_trending_tokens: getTrendingTokensTool,
		get_new_listings: getNewListingsTool,
		get_token_market_data: getTokenMarketDataTool,
		analyze_token_market_data: analyzeTokenMarketDataTool,
		rank_tokens: rankTokensTool,
	},
});

// Token Data Fetcher Agent - specialized for data gathering
export const tokenDataAgent = new Agent({
	name: "TokenDataAgent",
	instructions: `You are a data fetching specialist for cryptocurrency markets.

Your role:
1. Efficiently fetch trending tokens and new listings
2. Retrieve comprehensive historical data for analysis
3. Ensure data quality and completeness
4. Handle API errors gracefully
5. Optimize API calls to minimize latency

Always validate data before passing it forward and report any issues with data quality.`,
	model: openai("gpt-3.5-turbo"),
	tools: {
		get_trending_tokens: getTrendingTokensTool,
		get_new_listings: getNewListingsTool,
		get_token_market_data: getTokenMarketDataTool,
	},
});

// EMA Calculation Agent - specialized for technical analysis
export const technicalAnalysisAgent = new Agent({
	name: "TechnicalAnalysisAgent",
	instructions: `You are a technical analysis expert specializing in Exponential Moving Average calculations.

Your expertise:
1. Calculate accurate EMA values for any time period
2. Identify trend directions and momentum
3. Assess the strength of technical signals
4. Provide confidence levels for your analysis
5. Rank tokens based on technical merit

Use standard financial analysis practices and always explain your reasoning.`,
	model: openai("gpt-4"),
	tools: {
		analyze_token_market_data: analyzeTokenMarketDataTool,
		rank_tokens: rankTokensTool,
	},
});

export const agents = [
	tradingAnalysisAgent,
	tokenDataAgent,
	technicalAnalysisAgent,
];
