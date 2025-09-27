// Market data service using direct API calls to CoinGecko and other sources
// This implements the same functionality as the Solana Agent Kit market data methods

// CoinGecko API configuration for Demo tier
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

// Demo API rate limiting: 30 requests per minute
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries
const RATE_LIMIT_DELAY = 65000; // 65 seconds for rate limit recovery (just over 1 minute)

// Check for Demo API key
const COINGECKO_DEMO_API_KEY = process.env.COINGECKO_DEMO_API_KEY;

if (!COINGECKO_DEMO_API_KEY) {
	console.warn(
		"⚠️  COINGECKO_DEMO_API_KEY not found. Add it to your .env file for better rate limits."
	);
}

// Use Demo API if available, otherwise fall back to free tier
const API_BASE_URL = COINGECKO_BASE_URL;

// Simple in-memory cache to reduce API calls (more aggressive caching for demo tier)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (more aggressive caching)

export interface TokenPriceData {
	[tokenAddress: string]: {
		usd: number;
		usd_market_cap: number;
		usd_24h_vol: number;
		usd_24h_change: number;
		last_updated_at: number;
	};
}

export interface TrendingToken {
	id: string;
	name: string;
	symbol: string;
	thumb: string;
	market_cap_rank: number;
}

export interface TopGainer {
	id: string;
	symbol: string;
	name: string;
	image: string;
	current_price: number;
	market_cap: number;
	market_cap_rank: number;
	fully_diluted_valuation: number;
	total_volume: number;
	high_24h: number;
	low_24h: number;
	price_change_24h: number;
	price_change_percentage_24h: number;
	circulating_supply: number;
	total_supply: number;
	max_supply: number;
	ath: number;
	ath_change_percentage: number;
	ath_date: string;
	atl: number;
	atl_change_percentage: number;
	atl_date: string;
	last_updated: string;
}

export interface PoolData {
	pool_address: string;
	base_token: {
		address: string;
		symbol: string;
		name: string;
	};
	quote_token: {
		address: string;
		symbol: string;
		name: string;
	};
	volume_24h: number;
	liquidity_usd: number;
	created_at: string;
}

// Utility functions
function getCacheKey(url: string, params?: Record<string, any>): string {
	return `${url}?${new URLSearchParams(params || {})}`;
}

function getCachedData(key: string): any | null {
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}
	cache.delete(key); // Remove expired cache
	return null;
}

function setCachedData(key: string, data: any): void {
	cache.set(key, { data, timestamp: Date.now() });
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function makeApiRequest(url: string, retryCount = 0): Promise<any> {
	try {
		const headers: Record<string, string> = {
			Accept: "application/json",
		};

		// Add Demo API key if available
		if (COINGECKO_DEMO_API_KEY) {
			headers["x-cg-demo-api-key"] = COINGECKO_DEMO_API_KEY;
		}

		const response = await fetch(url, { headers });

		if (response.status === 429) {
			// Rate limited
			if (retryCount < MAX_RETRIES) {
				console.log(
					`Rate limited, retrying in ${RATE_LIMIT_DELAY}ms... (${
						retryCount + 1
					}/${MAX_RETRIES})`
				);
				await sleep(RATE_LIMIT_DELAY);
				return makeApiRequest(url, retryCount + 1);
			} else {
				throw new Error(
					"Rate limit exceeded, please upgrade to Pro API or wait before retrying"
				);
			}
		}

		if (!response.ok) {
			throw new Error(
				`CoinGecko API error: ${response.status} ${response.statusText}`
			);
		}

		return await response.json();
	} catch (error) {
		if (
			retryCount < MAX_RETRIES &&
			!(error instanceof Error && error.message.includes("Rate limit"))
		) {
			console.log(
				`Request failed, retrying in ${RETRY_DELAY}ms... (${
					retryCount + 1
				}/${MAX_RETRIES})`
			);
			await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
			return makeApiRequest(url, retryCount + 1);
		}
		throw error;
	}
}

export class MarketDataService {
	/**
	 * Get token price data for multiple tokens
	 */
	static async getTokenPriceData(
		tokenAddresses: string[]
	): Promise<TokenPriceData> {
		try {
			const cacheKey = `token_prices_${tokenAddresses.sort().join("_")}`;
			const cached = getCachedData(cacheKey);
			if (cached) return cached;

			// CoinGecko free tier only allows 1 token per request
			// Make individual requests for each token
			const results: TokenPriceData = {};

			for (const address of tokenAddresses) {
				try {
					const url = `${API_BASE_URL}/simple/token_price/solana?contract_addresses=${address}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;

					const data = await makeApiRequest(url);
					Object.assign(results, data);
				} catch (tokenError) {
					// Skip this token but continue with others
					console.warn(
						`Failed to fetch price for token ${address}:`,
						tokenError
					);
					continue;
				}
			}

			setCachedData(cacheKey, results);
			return results;
		} catch (error) {
			console.error("Error fetching token price data:", error);
			throw new Error("Failed to fetch token price data");
		}
	}

	/**
	 * Get trending tokens
	 */
	static async getTrendingTokens(): Promise<TrendingToken[]> {
		try {
			const cacheKey = "trending_tokens";
			const cached = getCachedData(cacheKey);
			if (cached) return cached;

			const url = `${API_BASE_URL}/search/trending`;
			const data = await makeApiRequest(url);

			const result = data.coins.map((coin: any) => ({
				id: coin.item.id,
				name: coin.item.name,
				symbol: coin.item.symbol,
				thumb: coin.item.thumb,
				market_cap_rank: coin.item.market_cap_rank,
			}));

			setCachedData(cacheKey, result);
			return result;
		} catch (error) {
			console.error("Error fetching trending tokens:", error);
			throw new Error("Failed to fetch trending tokens");
		}
	}

	/**
	 * Get top gaining tokens (Pro API required for detailed data)
	 */
	static async getTopGainers(
		duration: string = "24h",
		limit: string | number = 100
	): Promise<TopGainer[]> {
		try {
			const cacheKey = `top_gainers_${duration}_${limit}`;
			const cached = getCachedData(cacheKey);
			if (cached) return cached;

			// Use the free tier alternative method (works with Demo API)
			return await this.getTopGainersFreeTier(limit);
		} catch (error) {
			console.error("Error fetching top gainers:", error);
			throw new Error("Failed to fetch top gainers");
		}
	}

	/**
	 * Free tier alternative for top gainers using coins/markets endpoint
	 */
	private static async getTopGainersFreeTier(
		limit: string | number = 10
	): Promise<TopGainer[]> {
		try {
			const url = `${API_BASE_URL}/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=${limit}&page=1&sparkline=false`;
			const data = await makeApiRequest(url);

			return data.map((coin: any) => ({
				id: coin.id,
				symbol: coin.symbol,
				name: coin.name,
				image: coin.image,
				current_price: coin.current_price,
				market_cap: coin.market_cap,
				market_cap_rank: coin.market_cap_rank,
				price_change_24h: coin.price_change_24h,
				price_change_percentage_24h: coin.price_change_percentage_24h,
				last_updated: coin.last_updated,
			}));
		} catch (error) {
			console.error("Error fetching top gainers (free tier):", error);
			throw error;
		}
	}

	/**
	 * Get latest pools (Pro API required for detailed data)
	 */
	static async getLatestPools(): Promise<PoolData[]> {
		try {
			// Demo API doesn't include onchain endpoints
			console.warn(
				"Latest pools not available with Demo API. Returning empty array."
			);
			return [];
		} catch (error) {
			console.error("Error fetching latest pools:", error);
			// Return empty array instead of throwing error
			return [];
		}
	}

	/**
	 * Get trending pools
	 */
	static async getTrendingPools(
		duration: string = "24h"
	): Promise<PoolData[]> {
		try {
			// Demo API doesn't include onchain endpoints
			console.warn(
				"Trending pools not available with Demo API. Returning empty array."
			);
			return [];
		} catch (error) {
			console.error("Error fetching trending pools:", error);
			// Return empty array instead of throwing error
			return [];
		}
	}

	/**
	 * Get comprehensive market overview
	 */
	static async getMarketOverview() {
		try {
			const [trendingTokens, topGainers, latestPools] = await Promise.all(
				[
					this.getTrendingTokens(),
					this.getTopGainers("24h", 5),
					this.getLatestPools(),
				]
			);

			return {
				trendingTokens,
				topGainers,
				latestPools: latestPools.slice(0, 5), // Limit to 10 for overview
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error("Error fetching market overview:", error);
			throw new Error("Failed to fetch market overview");
		}
	}

	/**
	 * Get token price for specific tokens (commonly traded ones)
	 */
	static async getCommonTokenPrices() {
		const commonTokens = [
			"So11111111111111111111111111111111111111112", // SOL
			"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
			"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
			"ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx", // ATLAS
			"HUCyUYyUC5bXiPc4KHfMSD3GKKkAUU8Hf9EHARh3npa", // HUCY
		];

		return this.getTokenPriceData(commonTokens);
	}
}
