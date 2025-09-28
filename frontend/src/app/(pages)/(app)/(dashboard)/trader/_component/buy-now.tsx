import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClientApi } from "@/lib/hono/client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buyNow } from "./action";

export default function BuyNowModal({
	coin,
	children,
}: {
	coin: any;
	children: React.ReactNode;
}) {
	const [solAmount, setSolAmount] = useState<string>("");
	const [solPrice, setSolPrice] = useState<number>(0);
	const [tokenPrice, setTokenPrice] = useState<number>(0);
	const [tokensReceived, setTokensReceived] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingBuying, setLoadingBuying] = useState<boolean>(false);
	const buyRef = useRef<HTMLFormElement>(null);
	const [open, setOpen] = useState<boolean>(false);

	// Function to fetch prices
	const fetchPrices = async () => {
		try {
			setLoading(true);
			const api = createClientApi();

			// SOL mint address for price fetching
			const SOL_MINT = "So11111111111111111111111111111111111111112";

			// Fetch SOL price from pricing route
			let solPriceData = 0;
			try {
				const solResponse = await fetch(
					"http://localhost:3001/api/pricing/SOL"
				);
				if (solResponse.ok) {
					const solData = await solResponse.json();
					if ("price" in solData) {
						solPriceData = solData.price || 0;
					}
				}
			} catch (error) {
				console.error("Error fetching SOL price:", error);
			}

			// Fetch token price from birdeye
			let tokenPriceData = 0;
			if (coin.token?.address) {
				try {
					const tokenResponse = await api.birdeye.token[
						":address"
					].$get({
						param: { address: coin.token.address },
					});
					if (tokenResponse.ok) {
						const tokenData = await tokenResponse.json();
						if ("price" in tokenData) {
							tokenPriceData = tokenData.price || 0;
						}
					}
				} catch (error) {
					console.error("Error fetching token price:", error);
				}
			}

			setSolPrice(solPriceData);
			setTokenPrice(tokenPriceData);
		} catch (error) {
			console.error("Error fetching prices:", error);
		} finally {
			setLoading(false);
		}
	};

	// Calculate tokens received based on SOL amount
	useEffect(() => {
		const solAmountFloat = parseFloat(solAmount);
		if (
			!isNaN(solAmountFloat) &&
			solAmountFloat > 0 &&
			solPrice > 0 &&
			tokenPrice > 0
		) {
			const usdAmount = solAmountFloat * solPrice;
			const tokens = usdAmount / tokenPrice;
			setTokensReceived(tokens);
		} else {
			setTokensReceived(0);
		}
	}, [solAmount, solPrice, tokenPrice]);

	// Fetch prices initially and set up real-time updates every 3 seconds
	useEffect(() => {
		fetchPrices();
		const interval = setInterval(fetchPrices, 3000);
		return () => clearInterval(interval);
	}, [coin.token?.address]);

	const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		// Only allow valid numbers
		if (value === "" || /^\d*\.?\d*$/.test(value)) {
			setSolAmount(value);
		}
	};

	return (
		<>
			<form
				ref={buyRef}
				action={async () => {
					const result = await buyNow(coin, solAmount);
					if (result.success) {
						toast.success(
							`Bought ${solAmount} SOL for ${coin.token.symbol}`
						);
					} else {
						toast.error(result.error);
					}

					setOpen(false);
					setLoadingBuying(false);
				}}
				className="hidden"
			/>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent className="sm:max-w-md">
					<DialogTitle>Buy ${coin.token.symbol}</DialogTitle>

					<div className="space-y-4 pt-4">
						{/* SOL Amount Input */}
						<div>
							<label
								htmlFor="sol-amount"
								className="mb-2 block text-sm font-medium text-gray-200"
							>
								Amount in SOL
							</label>
							<Input
								id="sol-amount"
								type="text"
								placeholder="0.00"
								value={solAmount}
								onChange={handleSolAmountChange}
								className="border-gray-600 bg-gray-800 text-white placeholder-gray-400"
							/>
						</div>

						{/* Price Information */}
						<div className="bg-card space-y-2 rounded-lg p-3">
							<div className="flex justify-between text-sm">
								<span className="text-gray-400">
									SOL Price:
								</span>
								<span className="text-white">
									{loading
										? "..."
										: `$${solPrice.toFixed(2)}`}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-gray-400">
									{coin.token.symbol} Price:
								</span>
								<span className="text-white">
									{loading
										? "..."
										: `$${tokenPrice.toFixed(6)}`}
								</span>
							</div>
							<div className="border-t border-gray-700 pt-2">
								<div className="flex justify-between text-sm font-medium">
									<span className="text-gray-300">
										You will receive:
									</span>
									<span className="text-green-400">
										{tokensReceived > 0
											? `${tokensReceived.toLocaleString()} ${coin.token.symbol}`
											: "0.00"}
									</span>
								</div>
							</div>
						</div>

						{/* Buy Button */}
						<Button
							className="w-full bg-green-700 text-white hover:bg-green-800"
							disabled={
								!solAmount ||
								parseFloat(solAmount) <= 0 ||
								loadingBuying
							}
							onClick={() => {
								setLoadingBuying(true);
								buyRef.current?.requestSubmit();
							}}
						>
							{loadingBuying && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.15 }}
								>
									<Loader2 className="animate-spin" />
								</motion.div>
							)}
							Buy ${coin.token.symbol}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
