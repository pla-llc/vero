import {
	Keypair,
	Connection,
	PublicKey,
	LAMPORTS_PER_SOL,
	Transaction,
	SystemProgram,
	sendAndConfirmTransaction,
	VersionedTransaction,
} from "@solana/web3.js";
import {
	createTransferInstruction,
	getAssociatedTokenAddress,
	getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import prisma from "./prisma";
import { createJupiterApiClient } from "@jup-ag/api";
import axios from "axios";

// Use mainnet for all environments
const connection = new Connection(
	process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
	"confirmed"
);

// Jupiter API client for swaps
const jupiterQuoteApi = createJupiterApiClient();


// Common token addresses with FARTCOIN
export const TOKENS = {
	SOL: "So11111111111111111111111111111111111111112", // Wrapped SOL
	USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
	USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
	BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
	WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
	JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
	FARTCOIN: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
} as const;

export interface TokenMetadata {
	symbol: string;
	name: string;
	decimals: number;
	logoURI?: string;
	price?: number;
}

// Master wallet for funding new users
const getMasterWallet = (): Keypair | null => {
	const masterPrivateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
	if (!masterPrivateKey) {
		console.warn(
			"MASTER_WALLET_PRIVATE_KEY not found - auto-funding disabled"
		);
		return null;
	}

	try {
		const privateKeyBuffer = Buffer.from(masterPrivateKey, "base64");
		return Keypair.fromSecretKey(privateKeyBuffer);
	} catch (error) {
		console.error("Invalid master wallet private key:", error);
		return null;
	}
};

export interface WalletData {
	publicKey: string;
	privateKey: string;
	mnemonic: string;
}

export class WalletService {
	/**
	 * Generates a new Solana wallet with mnemonic phrase
	 */
	static generateWallet(): WalletData {
		// Generate a 12-word mnemonic phrase
		const mnemonic = bip39.generateMnemonic();

		// Convert mnemonic to seed
		const seed = bip39.mnemonicToSeedSync(mnemonic);

		// Derive the keypair using the standard Solana derivation path
		const derivedSeed = derivePath(
			"m/44'/501'/0'/0'",
			seed.toString("hex")
		).key;

		// Create the keypair from the derived seed
		const keypair = Keypair.fromSeed(derivedSeed);

		return {
			publicKey: keypair.publicKey.toString(),
			privateKey: Buffer.from(keypair.secretKey).toString("base64"),
			mnemonic: mnemonic,
		};
	}

	/**
	 * Automatically funds a new wallet with SOL from master wallet
	 */
	static async autoFundWallet(
		publicKeyString: string,
		amountSOL: number = 0.001
	): Promise<boolean> {
		const masterWallet = getMasterWallet();
		if (!masterWallet) {
			console.warn(
				"Master wallet not configured - skipping auto-funding"
			);
			return false;
		}

		try {
			const recipientPublicKey = new PublicKey(publicKeyString);
			const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

			// Create transfer transaction
			const transaction = new Transaction().add(
				SystemProgram.transfer({
					fromPubkey: masterWallet.publicKey,
					toPubkey: recipientPublicKey,
					lamports: lamports,
				})
			);

			// Send and confirm transaction
			const signature = await sendAndConfirmTransaction(
				connection,
				transaction,
				[masterWallet],
				{
					commitment: "confirmed",
					maxRetries: 3,
				}
			);

			console.log(
				`✅ Auto-funded wallet ${publicKeyString} with ${amountSOL} SOL. Signature: ${signature}`
			);
			return true;
		} catch (error) {
			console.error("Auto-funding failed:", error);
			return false;
		}
	}

	/**
	 * Creates wallet and automatically funds it
	 */
	static async createAndFundWallet(
		userId: string
	): Promise<WalletData & { funded: boolean }> {
		const walletData = this.generateWallet();

		// Store in database
		await prisma.wallet.create({
			data: {
				publicKey: walletData.publicKey,
				privateKey: walletData.privateKey,
				mnemonic: walletData.mnemonic,
				isActivated: false, // Will be set to true after funding
				userId: userId,
			},
		});

		// Attempt to auto-fund the wallet
		const funded = await this.autoFundWallet(walletData.publicKey);

		if (funded) {
			// Mark wallet as activated since it now has SOL
			await prisma.wallet.update({
				where: { userId },
				data: { isActivated: true },
			});
		}

		return { ...walletData, funded };
	}

	/**
	 * Gets the SOL balance for a wallet address
	 */
	static async getBalance(publicKeyString: string): Promise<number> {
		try {
			const publicKey = new PublicKey(publicKeyString);
			const balance = await connection.getBalance(publicKey);
			return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
		} catch (error) {
			console.error("Error getting balance:", error);
			return 0;
		}
	}

	/**
	 * Gets wallet balance for a user
	 */
	static async getUserWalletBalance(userId: string): Promise<number> {
		const wallet = await prisma.wallet.findUnique({
			where: { userId },
		});
		if (!wallet) {
			throw new Error("Wallet not found for user");
		}
		return await this.getBalance(wallet.publicKey);
	}

	/**
	 * Retrieves wallet data for a user
	 */
	static async getWalletForUser(userId: string) {
		return await prisma.wallet.findUnique({
			where: { userId },
		});
	}

	/**
	 * Recreates a Keypair from a base64 encoded private key
	 */
	static recreateKeypair(privateKeyBase64: string): Keypair {
		const privateKeyBuffer = Buffer.from(privateKeyBase64, "base64");
		return Keypair.fromSecretKey(privateKeyBuffer);
	}

	/**
	 * Fetches token metadata from Jupiter or other sources
	 */
	static async getTokenMetadata(
		mintAddress: string
	): Promise<TokenMetadata | null> {
		try {
			// First try Jupiter token list
			const response = await axios.get("https://token.jup.ag/all");
			const tokens = response.data;

			const token = tokens.find((t: any) => t.address === mintAddress);
			if (token) {
				return {
					symbol: token.symbol,
					name: token.name,
					decimals: token.decimals,
					logoURI: token.logoURI,
				};
			}

			// Fallback: try to get basic info from chain
			try {
				const publicKey = new PublicKey(mintAddress);
				// For now, return basic info - in production you'd want to use a metadata service
				return {
					symbol: "UNKNOWN",
					name: "Unknown Token",
					decimals: 6,
				};
			} catch {
				return null;
			}
		} catch (error) {
			console.error("Error fetching token metadata:", error);
			return null;
		}
	}

	/**
	 * Gets a quote for swapping tokens
	 */
	static async getSwapQuote(
		inputMint: string,
		outputMint: string,
		amount: number,
		slippageBps: number = 50
	) {
		try {
			// Rate limiting check

			// Handle SOL wrapping - Jupiter expects wrapped SOL address
			const processedInputMint =
				inputMint === "SOL" ? TOKENS.SOL : inputMint;
			const processedOutputMint =
				outputMint === "SOL" ? TOKENS.SOL : outputMint;

			const quote = await jupiterQuoteApi.quoteGet({
				inputMint: processedInputMint,
				outputMint: processedOutputMint,
				amount: amount,
				slippageBps,
				onlyDirectRoutes: false,
				asLegacyTransaction: false,
			});

			return {
				inputAmount: quote.inAmount,
				outputAmount: quote.outAmount,
				priceImpactPct: quote.priceImpactPct,
				routePlan: quote.routePlan,
				quote: quote,
			};
		} catch (error) {
			console.error("Error getting swap quote:", error);
			throw new Error("Failed to get swap quote");
		}
	}

	/**
	 * Executes a token swap for a user
	 */
	static async executeSwap(
		userId: string,
		inputMint: string,
		outputMint: string,
		amount: number,
		slippageBps: number = 50
	) {
		try {
			// Get user's wallet
			const wallet = await this.getWalletForUser(userId);
			if (!wallet) {
				throw new Error("Wallet not found for user");
			}

			// Recreate keypair from stored private key
			const userKeypair = this.recreateKeypair(wallet.privateKey);

			// Handle SOL wrapping - Jupiter expects wrapped SOL address
			const processedInputMint =
				inputMint === "SOL" ? TOKENS.SOL : inputMint;
			const processedOutputMint =
				outputMint === "SOL" ? TOKENS.SOL : outputMint;

			// Validate amount
			if (!amount || amount <= 0) {
				throw new Error("Invalid amount for swap");
			}

			console.log("Swap parameters:", {
				inputMint: processedInputMint,
				outputMint: processedOutputMint,
				amount: amount.toString(),
				userPublicKey: userKeypair.publicKey.toString(),
			});

			// Get fresh quote for the swap
			const quote = await jupiterQuoteApi.quoteGet({
				inputMint: processedInputMint,
				outputMint: processedOutputMint,
				amount: amount,
				slippageBps,
				onlyDirectRoutes: false,
				asLegacyTransaction: false,
			});

			if (!quote || !quote.inAmount || !quote.outAmount) {
				throw new Error("Unable to get valid swap quote");
			}

			console.log("Got quote:", {
				inAmount: quote.inAmount,
				outAmount: quote.outAmount,
				priceImpact: quote.priceImpactPct,
			});

			// Get swap transaction with minimal required parameters
			const swapResult = await jupiterQuoteApi.swapPost({
				swapRequest: {
					quoteResponse: quote,
					userPublicKey: userKeypair.publicKey.toString(),
					wrapAndUnwrapSol: true,
				},
			});

			if (!swapResult?.swapTransaction) {
				throw new Error("Invalid swap transaction received");
			}

			// Deserialize and sign transaction
			const swapTransactionBuf = Buffer.from(
				swapResult.swapTransaction,
				"base64"
			);
			const transaction =
				VersionedTransaction.deserialize(swapTransactionBuf);
			transaction.sign([userKeypair]);

			// Send transaction with better parameters
			const signature = await connection.sendTransaction(transaction, {
				maxRetries: 3,
				skipPreflight: true, // Skip preflight for better success rate
				preflightCommitment: "confirmed",
			});

			// Confirm transaction
			const confirmation = await connection.confirmTransaction(
				{
					signature,
					blockhash: transaction.message.recentBlockhash,
					lastValidBlockHeight:
						(await connection.getBlockHeight()) + 150,
				},
				"confirmed"
			);

			return {
				signature,
				success: !confirmation.value.err,
				inputAmount: quote.inAmount,
				outputAmount: quote.outAmount,
				priceImpactPct: quote.priceImpactPct,
			};
		} catch (error: any) {
			console.error("Error executing swap:", error);

			// Log detailed error information
			if (error.response && error.response.bodyUsed === false) {
				try {
					const errorText = await error.response.text();
					console.error("Jupiter API error response:", errorText);
				} catch (e) {
					console.error("Could not read error response body:", e);
				}
			} else if (error.response) {
				console.error(
					"Jupiter API error - body already used. Status:",
					error.response.status
				);
			}

			// More specific error handling
			if (error.message?.includes("422")) {
				throw new Error(
					"Invalid swap parameters. Please check token amounts and balances."
				);
			} else if (error.message?.includes("insufficient")) {
				throw new Error("Insufficient balance for this swap.");
			} else if (error.message?.includes("slippage")) {
				throw new Error(
					"Slippage tolerance exceeded. Try increasing slippage or reducing amount."
				);
			}

			throw new Error(`Swap failed: ${error.message || "Unknown error"}`);
		}
	}

	/**
	 * Gets token balance for a specific token (optimized)
	 */
	static async getTokenBalance(
		userId: string,
		tokenMint: string
	): Promise<number> {
		try {
			const wallet = await this.getWalletForUser(userId);
			if (!wallet) {
				throw new Error("Wallet not found for user");
			}

			const publicKey = new PublicKey(wallet.publicKey);

			// Handle SOL balance
			if (
				tokenMint === TOKENS.SOL ||
				tokenMint === "native" ||
				tokenMint === "SOL"
			) {
				const balance = await connection.getBalance(publicKey);
				return balance / LAMPORTS_PER_SOL;
			}

			// Handle SPL token balance with rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to avoid rate limits

			const tokenAccounts =
				await connection.getParsedTokenAccountsByOwner(publicKey, {
					mint: new PublicKey(tokenMint),
				});

			if (tokenAccounts.value.length === 0) {
				return 0;
			}

			const balance =
				tokenAccounts.value[0]!.account.data.parsed.info.tokenAmount
					.uiAmount;
			return balance || 0;
		} catch (error) {
			console.error("Error getting token balance:", error);
			return 0;
		}
	}

	/**
	 * Gets multiple token balances efficiently with rate limit protection
	 */
	static async getMultipleTokenBalances(
		userId: string,
		tokenMints: string[]
	): Promise<Record<string, number>> {
		const wallet = await this.getWalletForUser(userId);
		if (!wallet) {
			throw new Error("Wallet not found for user");
		}

		const publicKey = new PublicKey(wallet.publicKey);
		const balances: Record<string, number> = {};

		try {
			// Get SOL balance with retry logic
			let solBalance = 0;
			try {
				await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
				solBalance = await connection.getBalance(publicKey);
				balances.SOL = solBalance / LAMPORTS_PER_SOL;
			} catch (error) {
				console.log("SOL balance fetch failed, setting to 0");
				balances.SOL = 0;
			}

			// Get all SPL token accounts in one call (most efficient)
			try {
				await new Promise((resolve) => setTimeout(resolve, 200)); // Rate limit protection

				const tokenAccounts =
					await connection.getParsedTokenAccountsByOwner(publicKey, {
						programId: new PublicKey(
							"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
						), // SPL Token program
					});

				console.log(
					`Found ${tokenAccounts.value.length} token accounts`
				);

				// Map token accounts to balances
				for (const account of tokenAccounts.value) {
					const mintAddress = account.account.data.parsed.info.mint;
					const balance =
						account.account.data.parsed.info.tokenAmount.uiAmount ||
						0;

					// Only include tokens with balance > 0
					if (balance > 0) {
						// Find the token symbol for this mint
						const tokenEntry = Object.entries(TOKENS).find(
							([, address]) => address === mintAddress
						);
						if (tokenEntry) {
							balances[tokenEntry[0]] = balance;
						} else {
							// Store unknown tokens by their mint address
							balances[mintAddress] = balance;
						}
					}
				}

				// Initialize requested tokens that weren't found to 0
				tokenMints.forEach((mint) => {
					const tokenEntry = Object.entries(TOKENS).find(
						([, address]) => address === mint
					);
					const key = tokenEntry ? tokenEntry[0] : mint;
					if (
						!(key in balances) &&
						mint !== TOKENS.SOL &&
						key !== "SOL"
					) {
						balances[key] = 0;
					}
				});
			} catch (error) {
				console.error("Error getting SPL token balances:", error);

				// Fallback: set all non-SOL tokens to 0
				["USDC", "USDT", "BONK", "WIF", "JUP", "FARTCOIN"].forEach(
					(token) => {
						if (!(token in balances)) {
							balances[token] = 0;
						}
					}
				);
			}
		} catch (error) {
			console.error("Error in getMultipleTokenBalances:", error);
			// Return minimal data on complete failure
			return {
				SOL: 0,
				USDC: 0,
				USDT: 0,
				BONK: 0,
				WIF: 0,
				JUP: 0,
				FARTCOIN: 0,
			};
		}

		return balances;
	}

	/**
	 * Send tokens to external wallet
	 */
	static async sendTokens(
		userId: string,
		toAddress: string,
		tokenMint: string,
		amount: number
	) {
		try {
			const wallet = await this.getWalletForUser(userId);
			if (!wallet) {
				throw new Error("Wallet not found for user");
			}

			const userKeypair = this.recreateKeypair(wallet.privateKey);
			const toPubkey = new PublicKey(toAddress);

			if (tokenMint === "SOL") {
				// Send SOL
				const transaction = new Transaction().add(
					SystemProgram.transfer({
						fromPubkey: userKeypair.publicKey,
						toPubkey,
						lamports: Math.floor(amount * LAMPORTS_PER_SOL),
					})
				);

				const signature = await sendAndConfirmTransaction(
					connection,
					transaction,
					[userKeypair]
				);
				return { success: true, signature };
			} else {
				// Send SPL token (USDC)
				const mintPubkey = new PublicKey(
					tokenMint === "USDC" ? TOKENS.USDC : tokenMint
				);

				// Get source token account
				const sourceTokenAccount = await getAssociatedTokenAddress(
					mintPubkey,
					userKeypair.publicKey
				);

				// Get or create destination token account
				const destinationTokenAccount =
					await getOrCreateAssociatedTokenAccount(
						connection,
						userKeypair,
						mintPubkey,
						toPubkey
					);

				// Get token decimals (USDC has 6 decimals)
				const decimals = tokenMint === "USDC" ? 6 : 9;
				const transferAmount = Math.floor(
					amount * Math.pow(10, decimals)
				);

				// Create transfer instruction
				const transferInstruction = createTransferInstruction(
					sourceTokenAccount,
					destinationTokenAccount.address,
					userKeypair.publicKey,
					transferAmount
				);

				const transaction = new Transaction().add(transferInstruction);
				const signature = await sendAndConfirmTransaction(
					connection,
					transaction,
					[userKeypair]
				);

				return { success: true, signature };
			}
		} catch (error: any) {
			console.error("Error sending tokens:", error);
			throw new Error(`Failed to send ${tokenMint}: ${error.message}`);
		}
	}

	/**
	 * Get saved wallets for user
	 */
	static async getSavedWallets(userId: string) {
		return await prisma.savedWallet.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
	}

	/**
	 * Add saved wallet
	 */
	static async addSavedWallet(
		userId: string,
		label: string,
		address: string
	) {
		const count = await prisma.savedWallet.count({ where: { userId } });
		if (count >= 4) {
			throw new Error("Maximum 4 saved wallets allowed");
		}

		return await prisma.savedWallet.create({
			data: { userId, label, address },
		});
	}

	/**
	 * Delete saved wallet
	 */
	static async deleteSavedWallet(userId: string, walletId: string) {
		return await prisma.savedWallet.deleteMany({
			where: { id: walletId, userId },
		});
	}
}
