import axios from "axios";
import { TOKENS } from "./wallet";

export interface TokenPrice {
	symbol: string;
	price: number;
	priceChange24h: number;
	priceChangePercentage24h: number;
}

export interface PortfolioMetrics {
	totalValue: number;
	totalChange24h: number;
	totalChangePercentage24h: number;
	lastUpdated: string;
}

export class PriceService {
	private static readonly COINGECKO_API = "https://api.coingecko.com/api/v3";
	private static readonly CACHE_DURATION = 60000; // 1 minute cache
	private static priceCache: Map<string, { data: TokenPrice; timestamp: number }> = new Map();

	// CoinGecko token ID mappings for Solana tokens
	private static readonly TOKEN_IDS = {
		SOL: "solana",
		USDC: "usd-coin",
		USDT: "tether",
		BONK: "bonk",
		WIF: "dogwifcoin",
		JUP: "jupiter-exchange-solana",
		FARTCOIN: "fartcoin",
	};

	/**
	 * Get price data for a single token
	 */
	static async getTokenPrice(symbol: string): Promise<TokenPrice | null> {
		const cacheKey = symbol.toUpperCase();
		const cached = this.priceCache.get(cacheKey);

		// Return cached data if still valid
		if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
			return cached.data;
		}

		try {
			const tokenId = this.TOKEN_IDS[symbol.toUpperCase() as keyof typeof this.TOKEN_IDS];
			if (!tokenId) {
				console.warn(`No CoinGecko ID mapping for token: ${symbol}`);
				return null;
			}

			const response = await axios.get(
				`${this.COINGECKO_API}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true`,
				{
					timeout: 5000,
					headers: {
						'Accept': 'application/json',
					}
				}
			);

			const data = response.data[tokenId];
			if (!data) {
				return null;
			}

			const tokenPrice: TokenPrice = {
				symbol: symbol.toUpperCase(),
				price: data.usd || 0,
				priceChange24h: data.usd_24h_change || 0,
				priceChangePercentage24h: data.usd_24h_change || 0,
			};

			// Cache the result
			this.priceCache.set(cacheKey, {
				data: tokenPrice,
				timestamp: Date.now()
			});

			return tokenPrice;
		} catch (error) {
			console.error(`Error fetching price for ${symbol}:`, error);
			return null;
		}
	}

	/**
	 * Get price data for multiple tokens efficiently
	 */
	static async getMultipleTokenPrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
		const results: Record<string, TokenPrice> = {};
		const uncachedSymbols: string[] = [];

		// Check cache first
		for (const symbol of symbols) {
			const cacheKey = symbol.toUpperCase();
			const cached = this.priceCache.get(cacheKey);

			if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
				results[symbol.toUpperCase()] = cached.data;
			} else {
				uncachedSymbols.push(symbol);
			}
		}

		// Fetch uncached tokens
		if (uncachedSymbols.length > 0) {
			try {
				const tokenIds = uncachedSymbols
					.map(symbol => this.TOKEN_IDS[symbol.toUpperCase() as keyof typeof this.TOKEN_IDS])
					.filter(id => id);

				if (tokenIds.length > 0) {
					const response = await axios.get(
						`${this.COINGECKO_API}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
						{
							timeout: 10000,
							headers: {
								'Accept': 'application/json',
							}
						}
					);

					// Process each token's data
					for (const symbol of uncachedSymbols) {
						const tokenId = this.TOKEN_IDS[symbol.toUpperCase() as keyof typeof this.TOKEN_IDS];
						if (tokenId && response.data[tokenId]) {
							const data = response.data[tokenId];
							const tokenPrice: TokenPrice = {
								symbol: symbol.toUpperCase(),
								price: data.usd || 0,
								priceChange24h: data.usd_24h_change || 0,
								priceChangePercentage24h: data.usd_24h_change || 0,
							};

							results[symbol.toUpperCase()] = tokenPrice;

							// Cache the result
							this.priceCache.set(symbol.toUpperCase(), {
								data: tokenPrice,
								timestamp: Date.now()
							});
						}
					}
				}
			} catch (error) {
				console.error("Error fetching multiple token prices:", error);
			}
		}

		return results;
	}

	/**
	 * Calculate portfolio metrics from balances and prices
	 */
	static calculatePortfolioMetrics(
		balances: Record<string, number>,
		prices: Record<string, TokenPrice>
	): PortfolioMetrics {
		let totalValue = 0;
		let totalChange24h = 0;

		for (const [symbol, balance] of Object.entries(balances)) {
			if (balance > 0) {
				const price = prices[symbol.toUpperCase()];
				if (price) {
					const currentValue = balance * price.price;
					const previousValue = balance * (price.price - price.priceChange24h);

					totalValue += currentValue;
					totalChange24h += (currentValue - previousValue);
				}
			}
		}

		const totalChangePercentage24h = totalValue > 0 && totalChange24h !== 0
			? (totalChange24h / (totalValue - totalChange24h)) * 100
			: 0;

		return {
			totalValue,
			totalChange24h,
			totalChangePercentage24h,
			lastUpdated: new Date().toISOString(),
		};
	}

	/**
	 * Get real-time portfolio data including prices and changes
	 */
	static async getPortfolioData(balances: Record<string, number>): Promise<{
		balances: Record<string, number>;
		prices: Record<string, TokenPrice>;
		metrics: PortfolioMetrics;
		tokens: Array<{
			symbol: string;
			balance: number;
			price: number;
			value: number;
			change24h: number;
			changePercentage24h: number;
		}>;
	}> {
		// Get prices for all tokens with balances
		const symbolsWithBalances = Object.keys(balances).filter(symbol => (balances[symbol] || 0) > 0);
		const prices = await this.getMultipleTokenPrices(symbolsWithBalances);

		// Calculate metrics
		const metrics = this.calculatePortfolioMetrics(balances, prices);

		// Create detailed token array
		const tokens = Object.entries(balances)
			.filter(([_, balance]) => balance > 0)
			.map(([symbol, balance]) => {
				const price = prices[symbol.toUpperCase()];
				const tokenPrice = price?.price || 0;
				const value = balance * tokenPrice;
				const change24h = price?.priceChange24h || 0;
				const changePercentage24h = price?.priceChangePercentage24h || 0;

				return {
					symbol: symbol.toUpperCase(),
					balance,
					price: tokenPrice,
					value,
					change24h: change24h * balance, // Total change for this holding
					changePercentage24h,
				};
			})
			.sort((a, b) => b.value - a.value); // Sort by value descending

		return {
			balances,
			prices,
			metrics,
			tokens,
		};
	}

	/**
	 * Clear price cache
	 */
	static clearCache(): void {
		this.priceCache.clear();
	}
}
