"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	Copy,
	ExternalLink,
	Plus,
	RefreshCw,
	Send,
	Shield,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WalletInfo {
	publicKey: string;
	isActivated: boolean;
	createdAt: string;
	updatedAt: string;
}

interface SavedWallet {
	id: string;
	label: string;
	address: string;
}

interface TokenBalance {
	symbol: string;
	balance: number;
	usdValue?: number;
}

interface TransactionSummary {
	signature: string;
	timestamp: number;
	type: "send" | "receive" | "swap" | "other";
	amount?: number;
	token?: string;
	status: "confirmed" | "failed";
}

export default function WalletPage() {
	const [wallet, setWallet] = useState<WalletInfo | null>(null);
	const [portfolio, setPortfolio] = useState<TokenBalance[]>([]);
	const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
	const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showAddWallet, setShowAddWallet] = useState(false);
	const [newWalletLabel, setNewWalletLabel] = useState("");
	const [newWalletAddress, setNewWalletAddress] = useState("");
	const [sending, setSending] = useState(false);
	const [sendModal, setSendModal] = useState<{
		open: boolean;
		walletId: string;
		label: string;
		address: string;
		token: "SOL" | "USDC";
	} | null>(null);
	const [sendAmount, setSendAmount] = useState("");

	const fetchWalletData = async () => {
		try {
			// Fetch wallet info (essential)
			const walletResponse = await fetch(
				"http://localhost:3001/api/wallet/me",
				{
					credentials: "include",
				}
			);
			if (walletResponse.ok) {
				const walletData = await walletResponse.json();
				setWallet(walletData);
			}

			// Fetch saved wallets (essential for send functionality)
			try {
				const savedResponse = await fetch(
					"http://localhost:3001/api/wallet/saved-wallets",
					{
						credentials: "include",
					}
				);
				if (savedResponse.ok) {
					const data = await savedResponse.json();
					setSavedWallets(data.wallets || []);
				}
			} catch (error) {
				console.error("Error fetching saved wallets:", error);
			}

			// Fetch basic portfolio for send functionality (essential)
			try {
				const balancesResponse = await fetch(
					"http://localhost:3001/api/wallet/balances",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({
							tokens: ["SOL", "USDC"],
						}),
					}
				);

				if (balancesResponse.ok) {
					const data = await balancesResponse.json();
					const balances = data.balances || {};

					const portfolioData = Object.entries(balances)
						.filter(([_, balance]) => (balance as number) > 0)
						.map(([symbol, balance]) => ({
							symbol,
							balance: balance as number,
						}));

					setPortfolio(portfolioData);
				}
			} catch (error) {
				console.error("Error fetching balances:", error);
			}

			// Set loading to false after essential data is loaded
			setLoading(false);

			// Fetch non-essential data asynchronously (transactions)
			setTimeout(() => {
				fetchNonEssentialData();
			}, 100);
		} catch (error) {
			console.error("Error fetching wallet data:", error);
			setLoading(false);
		}
	};

	const fetchNonEssentialData = async () => {
		// Fetch recent transactions (non-essential)
		try {
			const transactionsResponse = await fetch(
				"http://localhost:3001/api/wallet/transactions?limit=5",
				{
					credentials: "include",
				}
			);
			if (transactionsResponse.ok) {
				const data = await transactionsResponse.json();
				setTransactions(data.transactions || []);
			}
		} catch (error) {
			console.error("Error fetching transactions:", error);
		}
	};

	const refreshData = async () => {
		setRefreshing(true);
		await fetchWalletData();
		setRefreshing(false);
		toast.success("Wallet data refreshed");
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Address copied to clipboard");
		} catch (error) {
			toast.error("Failed to copy address");
		}
	};

	const openInExplorer = () => {
		if (wallet) {
			window.open(
				`https://explorer.solana.com/address/${wallet.publicKey}`,
				"_blank"
			);
		}
	};

	const addSavedWallet = async () => {
		if (!newWalletLabel.trim() || !newWalletAddress.trim()) {
			toast.error("Please fill in both label and address");
			return;
		}

		try {
			const response = await fetch(
				"http://localhost:3001/api/wallet/saved-wallets",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						label: newWalletLabel,
						address: newWalletAddress,
					}),
				}
			);

			if (response.ok) {
				const data = await response.json();
				setSavedWallets((prev) => [...prev, data.wallet]);
				setNewWalletLabel("");
				setNewWalletAddress("");
				setShowAddWallet(false);
				toast.success("Wallet address saved!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save wallet");
			}
		} catch (error) {
			console.error("Error saving wallet:", error);
			toast.error("Failed to save wallet");
		}
	};

	const openSendModal = (
		walletId: string,
		label: string,
		address: string,
		token: "SOL" | "USDC"
	) => {
		setSendModal({ open: true, walletId, label, address, token });
		setSendAmount("");
	};

	const closeSendModal = () => {
		setSendModal(null);
		setSendAmount("");
	};

	const setMaxAmount = () => {
		if (!sendModal) return;

		const tokenBalance =
			portfolio.find((p) => p.symbol === sendModal.token)?.balance || 0;
		// Keep a small amount for fees if sending SOL
		const maxAmount =
			sendModal.token === "SOL"
				? Math.max(0, tokenBalance - 0.001)
				: tokenBalance;
		setSendAmount(maxAmount.toString());
	};

	const executeSend = async () => {
		if (!sendModal || !sendAmount) return;

		const amount = parseFloat(sendAmount);
		if (amount <= 0) {
			toast.error("Please enter a valid amount");
			return;
		}

		const tokenBalance =
			portfolio.find((p) => p.symbol === sendModal.token)?.balance || 0;
		const maxAmount =
			sendModal.token === "SOL" ? tokenBalance - 0.001 : tokenBalance;

		if (amount > maxAmount) {
			toast.error(`Insufficient ${sendModal.token} balance`);
			return;
		}

		setSending(true);
		try {
			const response = await fetch(
				"http://localhost:3001/api/wallet/send",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						toAddress: sendModal.address,
						amount,
						token: sendModal.token,
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					toast.success(
						`Sent ${amount} ${sendModal.token} to ${sendModal.label}`
					);
					fetchWalletData(); // Refresh balances
					closeSendModal();
				} else {
					toast.error("Transfer failed");
				}
			} else {
				const error = await response.json();
				toast.error(error.error || "Transfer failed");
			}
		} catch (error) {
			console.error(`Error sending ${sendModal.token}:`, error);
			toast.error("Transfer failed");
		} finally {
			setSending(false);
		}
	};

	const formatTransactionType = (type: string) => {
		switch (type) {
			case "send":
				return {
					icon: ArrowUpRight,
					color: "text-red-500",
					label: "Sent",
				};
			case "receive":
				return {
					icon: ArrowDownRight,
					color: "text-green-500",
					label: "Received",
				};
			case "swap":
				return {
					icon: RefreshCw,
					color: "text-gray-500",
					label: "Swapped",
				};
			default:
				return {
					icon: Activity,
					color: "text-gray-500",
					label: "Activity",
				};
		}
	};

	const formatTimeAgo = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		return "Just now";
	};

	useEffect(() => {
		fetchWalletData();
	}, []);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Wallet Management
					</h1>
					<p className="text-muted-foreground">
						Manage your Solana wallet and external addresses
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={refreshData}
						disabled={refreshing}
						variant="outline"
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
						/>
						{refreshing ? "Syncing..." : "Refresh"}
					</Button>
					{wallet && (
						<Button onClick={openInExplorer} variant="outline">
							<ExternalLink className="mr-2 h-4 w-4" />
							Explorer
						</Button>
					)}
				</div>
			</div>

			{wallet && (
				<div className="space-y-6">
					{/* Wallet Info Cards */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{/* Main Wallet Address */}
						<Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Wallet className="h-5 w-5 text-gray-600" />
									Your Wallet Address
								</CardTitle>
								<CardDescription>
									Your primary Solana wallet for receiving
									funds
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="bg-background rounded-lg border p-4">
									<code className="font-mono text-sm break-all">
										{wallet.publicKey}
									</code>
								</div>
								<div className="flex gap-2">
									<Button
										onClick={() =>
											copyToClipboard(wallet.publicKey)
										}
										variant="outline"
										className="flex-1"
									>
										<Copy className="mr-2 h-4 w-4" />
										Copy Address
									</Button>
									<Button
										onClick={openInExplorer}
										variant="outline"
										className="flex-1"
									>
										<ExternalLink className="mr-2 h-4 w-4" />
										View Explorer
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Security Status */}
						<Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5 text-green-600" />
									Security Status
								</CardTitle>
								<CardDescription>
									Wallet security and activation status
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										Status
									</span>
									<span
										className={`rounded-full px-2 py-1 text-sm ${
											wallet.isActivated
												? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
												: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
										}`}
									>
										{wallet.isActivated
											? "Active"
											: "Inactive"}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										Network
									</span>
									<span className="text-sm text-green-600 dark:text-green-400">
										Mainnet
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										Created
									</span>
									<span className="text-muted-foreground text-sm">
										{new Date(
											wallet.createdAt
										).toLocaleDateString()}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Saved Wallets */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<Send className="h-5 w-5" />
										External Wallets
									</CardTitle>
									<CardDescription>
										Manage external wallet addresses for
										quick transfers
									</CardDescription>
								</div>
								<Button
									onClick={() =>
										setShowAddWallet(!showAddWallet)
									}
									size="sm"
									disabled={savedWallets.length >= 4}
								>
									<Plus className="mr-1 h-4 w-4" />
									Add Wallet
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{showAddWallet && (
								<Card className="mb-4">
									<CardContent className="space-y-3 p-4">
										<input
											type="text"
											placeholder="Label (e.g. My Personal Wallet)"
											value={newWalletLabel}
											onChange={(e) =>
												setNewWalletLabel(
													e.target.value
												)
											}
											className="bg-background w-full rounded border px-3 py-2 text-sm"
										/>
										<input
											type="text"
											placeholder="Solana wallet address"
											value={newWalletAddress}
											onChange={(e) =>
												setNewWalletAddress(
													e.target.value
												)
											}
											className="bg-background w-full rounded border px-3 py-2 text-sm"
										/>
										<div className="flex gap-2">
											<Button
												onClick={addSavedWallet}
												size="sm"
												className="flex-1"
											>
												Save Wallet
											</Button>
											<Button
												onClick={() => {
													setShowAddWallet(false);
													setNewWalletLabel("");
													setNewWalletAddress("");
												}}
												variant="outline"
												size="sm"
												className="flex-1"
											>
												Cancel
											</Button>
										</div>
									</CardContent>
								</Card>
							)}

							{savedWallets.length > 0 ? (
								<div className="space-y-3">
									{savedWallets.map((savedWallet) => {
										const solBalance =
											portfolio.find(
												(p) => p.symbol === "SOL"
											)?.balance || 0;
										const usdcBalance =
											portfolio.find(
												(p) => p.symbol === "USDC"
											)?.balance || 0;
										const canSendSOL = solBalance > 0.001; // Keep 0.001 SOL for fees
										const canSendUSDC = usdcBalance > 0;

										return (
											<div
												key={savedWallet.id}
												className="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg border p-4 transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
														<Send className="h-4 w-4 text-white" />
													</div>
													<div>
														<div className="font-semibold">
															{savedWallet.label}
														</div>
														<div className="text-muted-foreground font-mono text-sm">
															{savedWallet.address.slice(
																0,
																12
															)}
															...
															{savedWallet.address.slice(
																-8
															)}
														</div>
													</div>
												</div>
												<div className="flex gap-2">
													<Button
														onClick={() =>
															openSendModal(
																savedWallet.id,
																savedWallet.label,
																savedWallet.address,
																"SOL"
															)
														}
														disabled={!canSendSOL}
														size="sm"
														variant="outline"
													>
														Send SOL
													</Button>
													<Button
														onClick={() =>
															openSendModal(
																savedWallet.id,
																savedWallet.label,
																savedWallet.address,
																"USDC"
															)
														}
														disabled={!canSendUSDC}
														size="sm"
														variant="outline"
													>
														Send USDC
													</Button>
													<Button
														onClick={() =>
															copyToClipboard(
																savedWallet.address
															)
														}
														size="sm"
														variant="ghost"
													>
														<Copy className="h-4 w-4" />
													</Button>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-muted-foreground py-8 text-center">
									<Wallet className="mx-auto mb-3 h-12 w-12 opacity-50" />
									<p className="font-medium">
										No external wallets yet
									</p>
									<p className="text-sm">
										Add up to 4 wallet addresses for quick
										transfers
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Recent Transactions */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Activity className="h-5 w-5" />
								Recent Activity
							</CardTitle>
							<CardDescription>
								Your recent wallet transactions
							</CardDescription>
						</CardHeader>
						<CardContent>
							{transactions.length > 0 ? (
								<div className="space-y-3">
									{transactions.map((tx) => {
										const typeInfo = formatTransactionType(
											tx.type
										);
										const TypeIcon = typeInfo.icon;

										return (
											<div
												key={tx.signature}
												className="bg-muted/50 flex items-center justify-between rounded-lg border p-3"
											>
												<div className="flex items-center gap-3">
													<div
														className={`bg-muted flex h-8 w-8 items-center justify-center rounded-full ${typeInfo.color}`}
													>
														<TypeIcon className="h-4 w-4" />
													</div>
													<div>
														<div className="text-sm font-medium">
															{typeInfo.label}
														</div>
														<div className="text-muted-foreground text-xs">
															{tx.token &&
															tx.amount
																? `${tx.amount.toFixed(6)} ${tx.token}`
																: "See explorer for details"}
														</div>
													</div>
												</div>
												<div className="text-right">
													<div className="text-sm font-medium">
														{tx.status ===
														"confirmed"
															? "Confirmed"
															: "Failed"}
													</div>
													<div className="text-muted-foreground text-xs">
														{formatTimeAgo(
															tx.timestamp
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-muted-foreground py-8 text-center">
									<Activity className="mx-auto mb-3 h-12 w-12 opacity-50" />
									<p className="font-medium">
										No recent transactions
									</p>
									<p className="text-sm">
										Your wallet activity will appear here
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Send Modal */}
			{sendModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={closeSendModal}
				>
					<div
						className="bg-background mx-4 w-full max-w-md rounded-lg border p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold">
									Send {sendModal.token}
								</h3>
								<p className="text-muted-foreground text-sm">
									To: {sendModal.label}
								</p>
								<p className="text-muted-foreground font-mono text-xs">
									{sendModal.address.slice(0, 12)}...
									{sendModal.address.slice(-12)}
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Available Balance</span>
									<span className="font-medium">
										{(() => {
											const tokenBalance =
												portfolio.find(
													(p) =>
														p.symbol ===
														sendModal.token
												)?.balance || 0;
											const availableBalance =
												sendModal.token === "SOL"
													? Math.max(
															0,
															tokenBalance - 0.001
														)
													: tokenBalance;
											return `${availableBalance.toFixed(6)} ${sendModal.token}`;
										})()}
									</span>
								</div>

								<div className="flex gap-2">
									<input
										type="number"
										placeholder="0.000000"
										value={sendAmount}
										onChange={(e) =>
											setSendAmount(e.target.value)
										}
										className="bg-muted flex-1 rounded border px-3 py-2 text-sm"
										step="0.000001"
										min="0"
									/>
									<Button
										onClick={setMaxAmount}
										variant="outline"
										size="sm"
									>
										MAX
									</Button>
								</div>

								{sendModal.token === "SOL" && (
									<p className="text-muted-foreground text-xs">
										* 0.001 SOL reserved for transaction
										fees
									</p>
								)}
							</div>

							<div className="flex gap-3">
								<Button
									onClick={executeSend}
									disabled={
										!sendAmount ||
										parseFloat(sendAmount) <= 0 ||
										sending
									}
									className="flex-1"
								>
									{sending ? (
										<>
											<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
											Sending...
										</>
									) : (
										<>
											<Send className="mr-2 h-4 w-4" />
											Send {sendModal.token}
										</>
									)}
								</Button>
								<Button
									onClick={closeSendModal}
									variant="outline"
									className="flex-1"
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
