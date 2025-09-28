import axios from "axios";

export class BirdEyeService {
	private static readonly BASE_URL = "https://public-api.birdeye.so";
	private static readonly API_KEY = process.env.BIRDEYE_API_KEY;
	private static lastRequestTime = 0;
	private static readonly MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds between requests

	/**
	 * Rate limit API requests to avoid hitting BirdEye rate limits
	 */
	private static async rateLimitRequest(): Promise<void> {
		const now = Date.now();
		const timeSinceLastRequest = now - this.lastRequestTime;

		if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
			const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
			console.log(
				`Rate limiting: waiting ${waitTime}ms before next request`
			);
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}

		this.lastRequestTime = Date.now();
	}

	/**
	 * Make a rate-limited HTTP request with retry logic
	 */
	private static async makeRequest(config: any): Promise<any> {
		await this.rateLimitRequest();

		let lastError: any;

		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				console.log(
					`[BirdEye Debug] Making request to: ${config.method?.toUpperCase()} ${
						config.url
					}`
				);
				const response = await axios(config);

				// Check for rate limit in response headers
				const rateLimitRemaining =
					response.headers["x-ratelimit-remaining"];
				const retryAfter = response.headers["retry-after"];

				console.log(
					`[BirdEye Debug] Response status: ${response.status}`
				);
				console.log(
					`[BirdEye Debug] Rate limit remaining: ${rateLimitRemaining}`
				);

				if (rateLimitRemaining === "0" && retryAfter) {
					const waitTime = parseInt(retryAfter) * 1000;
					console.log(
						`Rate limit exceeded, waiting ${waitTime}ms before retry`
					);
					await new Promise((resolve) =>
						setTimeout(resolve, waitTime)
					);
					continue;
				}

				console.log(
					`[BirdEye Debug] Response data:`,
					JSON.stringify(response.data, null, 2)
				);
				return response.data;
			} catch (error: any) {
				lastError = error;

				console.error(
					`[BirdEye Debug] Request failed (attempt ${attempt + 1}):`,
					{
						status: error.response?.status,
						statusText: error.response?.statusText,
						data: error.response?.data,
						headers: error.response?.headers,
					}
				);

				// Check if it's a rate limit error
				if (error.response?.status === 429) {
					const retryAfter = error.response.headers["retry-after"];
					const waitTime = retryAfter
						? parseInt(retryAfter) * 1000
						: 1000;
					console.log(
						`Rate limit error (attempt ${
							attempt + 1
						}), waiting ${waitTime}ms`
					);
					await new Promise((resolve) =>
						setTimeout(resolve, waitTime)
					);
					continue;
				}

				// For other errors, don't retry
				break;
			}
		}

		throw lastError;
	}

	/**
	 * Get trending tokens from BirdEye API
	 * @param options - Query parameters for the trending tokens request
	 * @returns Promise with trending tokens data
	 */
	static async getTrendingTokens(
		options: {
			sort_by?: string;
			sort_type?: "asc" | "desc";
			offset?: number;
			limit?: number;
			ui_amount_mode?: string;
		} = {}
	) {
		const {
			sort_by = "volume24hUSD",
			sort_type = "asc",
			offset = 0,
			limit = 5,
			ui_amount_mode = "scaled",
		} = options;

		const url = `${this.BASE_URL}/defi/token_trending`;
		const params = new URLSearchParams({
			sort_by,
			sort_type,
			offset: offset.toString(),
			limit: limit.toString(),
			ui_amount_mode,
		});

		try {
			return await this.makeRequest({
				method: "GET",
				url: `${url}?${params.toString()}`,
				headers: {
					"X-API-KEY": this.API_KEY,
					accept: "application/json",
					"x-chain": "solana",
				},
			});
		} catch (error) {
			console.error(
				"Error fetching trending tokens from BirdEye:",
				error
			);
			throw new Error("Failed to fetch trending tokens");
		}
	}

	/**
	 * Get new token listings from BirdEye API
	 * @param options - Query parameters for the new listings request
	 * @returns Promise with new listings data
	 */
	static async getNewListings(
		options: {
			limit?: number;
			meme_platform_enabled?: boolean;
		} = {}
	) {
		const { limit = 3, meme_platform_enabled = true } = options;

		const url = `${this.BASE_URL}/defi/v2/tokens/new_listing`;
		const params = new URLSearchParams({
			limit: limit.toString(),
			meme_platform_enabled: meme_platform_enabled.toString(),
		});

		try {
			return await this.makeRequest({
				method: "GET",
				url: `${url}?${params.toString()}`,
				headers: {
					"X-API-KEY": this.API_KEY,
					accept: "application/json",
					"x-chain": "solana",
				},
			});
		} catch (error) {
			console.error("Error fetching new listings from BirdEye:", error);
			throw new Error("Failed to fetch new listings");
		}
	}

	/**
	 * Get historical price data for a token
	 * @param address - Token contract address
	 * @param type - Time period (1D, 7D, 30D)
	 * @returns Promise with historical price data
	 */
	static async getHistoricalData(address: string, type: string = "7D") {
		const url = `${this.BASE_URL}/defi/history_price`;
		const params = new URLSearchParams({
			address,
			address_type: "token",
			type,
		});

		try {
			return await this.makeRequest({
				method: "GET",
				url: `${url}?${params.toString()}`,
				headers: {
					"X-API-KEY": this.API_KEY,
					accept: "application/json",
					"x-chain": "solana",
				},
			});
		} catch (error) {
			console.error(
				`Error fetching historical data for ${address}:`,
				error
			);
			throw new Error(
				`Failed to fetch historical data for token ${address}`
			);
		}
	}

	/**
	 * Get multiple tokens' data in batch
	 * @param addresses - Array of token addresses
	 * @returns Promise with multiple token data
	 */
	static async getMultipleTokenData(addresses: string[]) {
		const url = `${this.BASE_URL}/defi/multi_price`;

		try {
			return await this.makeRequest({
				method: "POST",
				url,
				data: {
					list_address: addresses,
				},
				headers: {
					"X-API-KEY": this.API_KEY,
					"Content-Type": "application/json",
					accept: "application/json",
					"x-chain": "solana",
				},
			});
		} catch (error) {
			console.error("Error fetching multiple token data:", error);
			throw new Error("Failed to fetch multiple token data");
		}
	}

	/**
	 * Get market data for a single token
	 * @param address - Token contract address
	 * @returns Promise with token market data
	 */
	static async getTokenMarketData(address: string) {
		const url = `${this.BASE_URL}/defi/v3/token/market-data`;
		const params = new URLSearchParams({
			address,
		});

		try {
			return await this.makeRequest({
				method: "GET",
				url: `${url}?${params.toString()}`,
				headers: {
					"X-API-KEY": this.API_KEY,
					accept: "application/json",
					"x-chain": "solana",
				},
			});
		} catch (error) {
			console.error(`Error fetching market data for ${address}:`, error);
			throw new Error(`Failed to fetch market data for token ${address}`);
		}
	}
}
