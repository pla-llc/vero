// Simple workflow definition for token analysis
// The actual workflow execution is handled in the Inngest functions

export interface TokenAnalysisWorkflowParams {
	trendingLimit?: number;
	newListingsLimit?: number;
	analysisCount?: number;
}

export interface TokenAnalysisResult {
	success: boolean;
	report?: {
		timestamp: string;
		analysis: {
			totalTokensAnalyzed: number;
			trendingTokensFetched: number;
			newListingsFetched: number;
			tokensWithValidData: number;
			topTokensSelected: number;
		};
		results: any[];
		errors: any[];
	};
	error?: string;
}

// Workflow schema for validation
export const tokenAnalysisWorkflowSchema = {
	name: "token-analysis-workflow",
	description:
		"Analyzes trending and new tokens using EMA calculations to select top performers",
	steps: [
		"fetch_trending_tokens",
		"fetch_new_listings",
		"combine_tokens",
		"fetch_historical_data",
		"calculate_ema_analysis",
		"select_top_tokens",
	],
	defaultParams: {
		trendingLimit: 10,
		newListingsLimit: 10,
		analysisCount: 5,
	},
};

// Helper function to extract tokens from agent responses
export function extractTokensFromResponse(response: any): any[] {
	try {
		// This would need to be adapted based on the actual response format
		// from the agents and tools
		if (response && response.tokens) {
			return response.tokens;
		}

		// If response is a string, try to parse it
		if (typeof response === "string") {
			const parsed = JSON.parse(response);
			return parsed.tokens || [];
		}

		return [];
	} catch (error) {
		console.error("Error extracting tokens from response:", error);
		return [];
	}
}

export const workflows = [tokenAnalysisWorkflowSchema];
