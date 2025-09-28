import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";

export interface WalletActivity {
	isActive: boolean;
	lastTransactionTime: string | null;
	transactionCount24h: number;
	totalTransactions: number;
	status: "Mainnet" | "Testnet" | "Inactive";
}

export interface TransactionSummary {
	signature: string;
	timestamp: number;
	type: "send" | "receive" | "swap" | "other";
	amount?: number;
	token?: string;
	status: "confirmed" | "failed";
}

export class ActivityService {
	private static readonly connection = new Connection(
		process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
		"confirmed"
	);
	private static readonly CACHE_DURATION = 120000; // 2 minutes cache
	private static activityCache: Map<string, { data: WalletActivity; timestamp: number }> = new Map();

	/**
	 * Get wallet activity status and metrics
	 */
	static async getWalletActivity(publicKeyString: string): Promise<WalletActivity> {
		const cacheKey = publicKeyString;
		const cached = this.activityCache.get(cacheKey);

		// Return cached data if still valid
		if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
			return cached.data;
		}

		try {
			const publicKey = new PublicKey(publicKeyString);

			// Get recent transactions (limit to last 20 for performance)
			const signatures = await this.connection.getSignaturesForAddress(
				publicKey,
				{
					limit: 20,
				}
			);

			const now = Date.now();
			const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

			// Count transactions in last 24 hours
			const transactionCount24h = signatures.filter(sig =>
				sig.blockTime && (sig.blockTime * 1000) > twentyFourHoursAgo
			).length;

			// Get last transaction time
			const lastTransactionTime = signatures.length > 0 && signatures[0].blockTime
				? new Date(signatures[0].blockTime * 1000).toISOString()
				: null;

			// Determine if wallet is active (transaction within last 7 days)
			const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
			const isActive = signatures.some(sig =>
				sig.blockTime && (sig.blockTime * 1000) > sevenDaysAgo
			);

			// Determine network status - since we're on mainnet, always "Mainnet" if active
			const status: "Mainnet" | "Testnet" | "Inactive" = isActive ? "Mainnet" : "Inactive";

			const activity: WalletActivity = {
				isActive,
				lastTransactionTime,
				transactionCount24h,
				totalTransactions: signatures.length,
				status,
			};

			// Cache the result
			this.activityCache.set(cacheKey, {
				data: activity,
				timestamp: Date.now()
			});

			return activity;
		} catch (error) {
			console.error("Error fetching wallet activity:", error);

			// Return default inactive state on error
			return {
				isActive: false,
				lastTransactionTime: null,
				transactionCount24h: 0,
				totalTransactions: 0,
				status: "Inactive",
			};
		}
	}

	/**
	 * Get recent transaction summary for display
	 */
	static async getRecentTransactions(
		publicKeyString: string,
		limit: number = 10
	): Promise<TransactionSummary[]> {
		try {
			const publicKey = new PublicKey(publicKeyString);

			// Get recent transaction signatures
			const signatures = await this.connection.getSignaturesForAddress(
				publicKey,
				{ limit: Math.min(limit, 10) }
			);

			const transactions: TransactionSummary[] = [];

			// Process only the first few transactions to avoid hitting rate limits
			const maxToProcess = Math.min(signatures.length, 5);

			for (let i = 0; i < maxToProcess; i++) {
				const sig = signatures[i];
				try {
					// Add delay between requests to avoid rate limits
					if (i > 0) {
						await new Promise(resolve => setTimeout(resolve, 200));
					}

					const transaction = await this.connection.getParsedTransaction(
						sig.signature,
						{
							maxSupportedTransactionVersion: 0,
						}
					);

					if (transaction && transaction.blockTime) {
						const summary: TransactionSummary = {
							signature: sig.signature,
							timestamp: transaction.blockTime * 1000,
							type: this.determineTransactionType(transaction, publicKey),
							status: sig.err ? "failed" : "confirmed",
						};

						// Try to extract amount and token info
						const { amount, token } = this.extractTransactionAmount(transaction, publicKey);
						if (amount !== undefined) summary.amount = amount;
						if (token) summary.token = token;

						transactions.push(summary);
					}
				} catch (txError) {
					console.warn(`Failed to parse transaction ${sig.signature}:`, txError);
					// Add basic transaction info even if parsing fails
					transactions.push({
						signature: sig.signature,
						timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
						type: "other",
						status: sig.err ? "failed" : "confirmed",
					});
				}
			}

			// Add remaining signatures as basic entries (without full parsing)
			for (let i = maxToProcess; i < signatures.length; i++) {
				const sig = signatures[i];
				transactions.push({
					signature: sig.signature,
					timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
					type: "other",
					status: sig.err ? "failed" : "confirmed",
				});
			}

			return transactions;
		} catch (error) {
			console.error("Error fetching recent transactions:", error);
			return [];
		}
	}

	/**
	 * Determine transaction type based on parsed transaction data
	 */
	private static determineTransactionType(
		transaction: ParsedTransactionWithMeta,
		userPublicKey: PublicKey
	): "send" | "receive" | "swap" | "other" {
		if (!transaction.meta || !transaction.transaction.message.instructions) {
			return "other";
		}

		const instructions = transaction.transaction.message.instructions;

		// Check for Jupiter swap program (common swap aggregator)
		const hasSwapInstruction = instructions.some(instruction => {
			if ('programId' in instruction) {
				const programId = instruction.programId.toString();
				// Jupiter program IDs
				return programId === "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB" ||
					   programId === "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
			}
			return false;
		});

		if (hasSwapInstruction) {
			return "swap";
		}

		// Check for token transfers
		const preBalances = transaction.meta.preTokenBalances || [];
		const postBalances = transaction.meta.postTokenBalances || [];

		// Simple heuristic: if user's SOL balance decreased significantly, likely a send
		const preBalance = transaction.meta.preBalances[0] || 0;
		const postBalance = transaction.meta.postBalances[0] || 0;
		const balanceChange = postBalance - preBalance;

		// Account for transaction fees
		if (balanceChange < -5000) { // More than 0.000005 SOL decrease (accounting for fees)
			return "send";
		} else if (balanceChange > 1000) { // Any increase
			return "receive";
		}

		return "other";
	}

	/**
	 * Extract transaction amount and token information
	 */
	private static extractTransactionAmount(
		transaction: ParsedTransactionWithMeta,
		userPublicKey: PublicKey
	): { amount?: number; token?: string } {
		if (!transaction.meta) {
			return {};
		}

		// For SOL transfers
		const preBalance = transaction.meta.preBalances[0] || 0;
		const postBalance = transaction.meta.postBalances[0] || 0;
		const balanceChange = Math.abs(postBalance - preBalance) / 1e9; // Convert to SOL

		if (balanceChange > 0.0001) { // Meaningful SOL change (above dust)
			return {
				amount: balanceChange,
				token: "SOL"
			};
		}

		// For token transfers, this would require more complex parsing
		// For now, return undefined for token amounts
		return {};
	}

	/**
	 * Clear activity cache
	 */
	static clearCache(): void {
		this.activityCache.clear();
	}
}
