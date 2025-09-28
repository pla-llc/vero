"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClientApi } from "@/lib/hono/client";
import { motion } from "framer-motion";
import { BarChart3, Clock, Loader2, Sparkles, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import BuyNowModal from "./_component/buy-now";

export default function TraderPage() {
	const [ranAlgo, setRanAlgo] = useState(false);
	const [loading, setLoading] = useState(false);
	const [coinData, setCoinData] = useState<any>(null);

	const algoForm = useRef<HTMLFormElement>(null);

	const runAlgo = () => {
		setLoading(true);
		algoForm.current?.requestSubmit();
	};

	const stats = [
		{
			label: "Success Rate",
			value: "87%",
			icon: <Target className="h-4 w-4" />,
		},
		{
			label: "Response Time",
			value: "20.3s",
			icon: <Clock className="h-4 w-4" />,
		},
		{
			label: "Coins",
			value: "5,000+",
			icon: <BarChart3 className="h-4 w-4" />,
		},
	];

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-black p-8">
			<form
				ref={algoForm}
				action={async () => {
					try {
						const api = createClientApi();
						const res = await api.analysis.tokens[
							"analyze-sync"
						].$post({
							json: {
								trendingLimit: 5,
								newListingsLimit: 5,
								analysisCount: 3,
							},
						});
						const data = await res.json();

						setCoinData(data);
						setRanAlgo(true);
						setLoading(false);
					} catch (error) {
						toast.error("The algorithm failed to complete");
					}
				}}
				className="hidden"
			></form>
			<motion.div
				initial={{ opacity: loading ? 1 : 0 }}
				animate={{ opacity: loading ? 1 : 0 }}
				transition={{ duration: 0.3 }}
				className="pointer-events-none absolute top-0 left-0 flex h-full w-full items-center justify-center bg-black"
			>
				<Loader2 className="h-10 w-10 animate-spin text-white" />
			</motion.div>
			{!ranAlgo ? (
				<>
					<div className="w-full max-w-4xl space-y-12">
						{/* Hero Section */}
						<div className="space-y-8">
							<div className="flex items-center gap-6">
								<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
									<Sparkles className="h-8 w-8 text-black" />
								</div>
								<div>
									<Badge
										variant="outline"
										className="mb-3 border-gray-600 text-gray-400"
									>
										AI Trading Algorithm
									</Badge>
									<h1 className="text-5xl leading-tight font-bold text-white">
										Intelligent Trading
										<br />
										<span className="text-gray-400">
											On Autopilot
										</span>
									</h1>
								</div>
							</div>

							<p className="max-w-3xl text-xl leading-relaxed text-gray-300">
								Advanced AI analyzes market trends, identifies
								the best opportunities, and executes trades
								automatically. Professional trading made simple.
							</p>

							{/* Stats */}
							<div className="flex gap-8">
								{stats.map((stat, index) => (
									<div key={index} className="text-center">
										<div className="mb-1 flex items-center justify-center gap-2">
											<span className="text-gray-400">
												{stat.icon}
											</span>
											<span className="text-2xl font-bold text-white">
												{stat.value}
											</span>
										</div>
										<p className="text-sm text-gray-500">
											{stat.label}
										</p>
									</div>
								))}
							</div>
						</div>

						{/* Features Grid */}
						{/* <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{features.map((feature, index) => (
							<Card
								key={index}
								className="border border-gray-800 bg-gray-900/50 p-6 transition-all duration-200 hover:border-gray-700"
							>
								<div className="mb-4 flex items-center gap-4">
									<div className="rounded-lg bg-gray-800 p-2">
										<span className="text-gray-300">
											{feature.icon}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-white">
										{feature.title}
									</h3>
								</div>
								<p className="leading-relaxed text-gray-400">
									{feature.description}
								</p>
							</Card>
						))}
					</div> */}

						{/* CTA Section */}
						<div className="space-y-4">
							<Button
								size="lg"
								className="h-auto bg-white px-8 py-3 text-lg font-medium text-black hover:bg-gray-200"
								onClick={runAlgo}
							>
								<Zap className="mr-2 h-5 w-5" />
								Vibe Trade Now
							</Button>
						</div>

						{/* Bottom Info */}
						<div className="max-w-4xl rounded-lg border border-gray-800 bg-gray-900/30 p-6">
							<h4 className="mb-3 font-semibold text-white">
								How it works
							</h4>
							<div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
								<div>
									<span className="font-medium text-white">
										1. Analyze
									</span>
									<p className="mt-1 text-gray-400">
										AI scans market conditions and
										identifies opportunities
									</p>
								</div>
								<div>
									<span className="font-medium text-white">
										2. Execute
									</span>
									<p className="mt-1 text-gray-400">
										Automated trading based on proven
										strategies
									</p>
								</div>
								<div>
									<span className="font-medium text-white">
										3. Vibe
									</span>
									<p className="mt-1 text-gray-400">
										Just keep vibe trading
									</p>
								</div>
							</div>
						</div>
					</div>
				</>
			) : (
				<div className="w-full max-w-6xl space-y-8">
					{coinData && (
						<>
							{/* Header */}
							<div className="space-y-4 text-center">
								<Badge
									variant="outline"
									className="border-green-600 text-green-500"
								>
									Analysis Complete
								</Badge>
								<h2 className="text-3xl font-bold text-white">
									Top Trading Opportunities
								</h2>
								<p className="text-gray-400">
									AI-powered analysis of{" "}
									{coinData.summary?.totalTokensFetched || 0}{" "}
									tokens
								</p>
							</div>

							{/* Top 3 Coins Grid */}
							{coinData.results &&
								coinData.results.length > 0 && (
									<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
										{coinData.results
											.slice(0, 3)
											.map((coin: any, index: number) => (
												<motion.div
													key={
														coin.token?.address ||
														index
													}
													initial={{
														opacity: 0,
														y: 20,
													}}
													animate={{
														opacity: 1,
														y: 0,
													}}
													transition={{
														delay: index * 0.1,
													}}
													className="bg-card relative block rounded-lg border p-6 transition-colors hover:border-gray-600 hover:bg-gray-800"
												>
													<Link
														href={`https://dexscreener.com/solana/${coin.token?.address}`}
														target="_blank"
														rel="noopener noreferrer"
														passHref
													>
														{/* Rank Badge */}
														<div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
															{index + 1}
														</div>

														{/* Token Info */}
														<div className="space-y-4">
															<div className="flex items-center justify-between">
																<div>
																	<h3 className="text-xl font-bold text-white">
																		{coin
																			.token
																			?.symbol ||
																			"Unknown"}
																	</h3>
																	<p className="truncate text-sm text-gray-400">
																		{coin
																			.token
																			?.name ||
																			coin
																				.token
																				?.address ||
																			"No name available"}
																	</p>
																</div>
																<div className="text-right">
																	<div className="text-2xl font-bold text-white">
																		{coin.score
																			? coin.score.toFixed(
																					1
																				)
																			: "N/A"}
																	</div>
																	<div className="text-xs text-gray-400">
																		Score
																	</div>
																</div>
															</div>

															{/* Recommendation */}
															<div className="flex justify-center">
																<Badge
																	variant={
																		coin.recommendation ===
																		"BUY"
																			? "default"
																			: coin.recommendation ===
																				  "SELL"
																				? "destructive"
																				: "secondary"
																	}
																	className={`${
																		coin.recommendation ===
																		"BUY"
																			? "bg-green-600 text-white"
																			: coin.recommendation ===
																				  "SELL"
																				? "bg-red-500 text-white"
																				: "bg-gray-500 text-white"
																	} font-medium`}
																>
																	{coin.recommendation ||
																		"HOLD"}
																</Badge>
															</div>

															{/* Key Metrics */}
															{coin.metrics && (
																<div className="mb-4 grid grid-cols-2 gap-2 text-xs">
																	{Object.entries(
																		coin.metrics
																	)
																		.slice(
																			0,
																			4
																		)
																		.map(
																			([
																				key,
																				value,
																			]: [
																				string,
																				any,
																			]) => (
																				<div
																					key={
																						key
																					}
																					className="rounded bg-gray-700/40 px-2 py-1"
																				>
																					<div className="text-gray-400 capitalize">
																						{key
																							.replace(
																								/([A-Z])/g,
																								" $1"
																							)
																							.toLowerCase()}
																					</div>
																					<div className="font-medium text-white">
																						{typeof value ===
																						"number"
																							? value.toLocaleString()
																							: String(
																									value
																								).slice(
																									0,
																									10
																								) +
																								(String(
																									value
																								)
																									.length >
																								10
																									? "..."
																									: "")}
																					</div>
																				</div>
																			)
																		)}
																</div>
															)}

															{/* Buy Now Button */}
														</div>
													</Link>
													<div className="flex justify-center pt-2">
														<BuyNowModal
															coin={coin}
														>
															<Button
																size="sm"
																variant="outline"
																className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
															>
																Buy Now
															</Button>
														</BuyNowModal>
													</div>
												</motion.div>
											))}
									</div>
								)}

							{/* Analysis Details Section */}
							<div className="space-y-6">
								{/* Summary Statistics */}
								{coinData.summary && (
									<div className="bg-card rounded-lg border p-6">
										<h3 className="mb-4 text-xl font-semibold text-white">
											Analysis Summary
										</h3>
										<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
											<div className="text-center">
												<div className="text-2xl font-bold text-white">
													{coinData.summary
														.totalTokensFetched ||
														0}
												</div>
												<div className="text-xs text-gray-400">
													Tokens Fetched
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-gray-300">
													{coinData.summary
														.tokensAnalyzed || 0}
												</div>
												<div className="text-xs text-gray-400">
													Analyzed
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-green-500">
													{coinData.summary
														.successfulAnalyses ||
														0}
												</div>
												<div className="text-xs text-gray-400">
													Successful
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-red-400">
													{coinData.summary
														.failedAnalyses || 0}
												</div>
												<div className="text-xs text-gray-400">
													Failed
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-yellow-600">
													{coinData.summary
														.topTokensSelected || 0}
												</div>
												<div className="text-xs text-gray-400">
													Top Selected
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Detailed Analysis for Each Token */}
								{coinData.results &&
									coinData.results.length > 0 && (
										<div className="space-y-4">
											<h3 className="text-xl font-semibold text-white">
												Detailed{" "}
												<span className="text-yellow-600">
													Analysis
												</span>
											</h3>
											{coinData.results.map(
												(coin: any, index: number) => (
													<motion.div
														key={
															coin.token
																?.address ||
															index
														}
														initial={{
															opacity: 0,
															x: -20,
														}}
														animate={{
															opacity: 1,
															x: 0,
														}}
														transition={{
															delay: index * 0.1,
														}}
														className="bg-card rounded-lg border p-6"
													>
														<div className="grid gap-6 md:grid-cols-3">
															{/* Token Details */}
															<div>
																<h4 className="mb-2 font-semibold text-white">
																	#{index + 1}{" "}
																	<a
																		href={`https://dexscreener.com/solana/${coin.token?.address}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="text-white underline hover:text-gray-300"
																	>
																		{coin
																			.token
																			?.symbol ||
																			"Unknown Token"}
																	</a>
																</h4>
																<div className="space-y-2 text-sm">
																	<div>
																		<span className="text-gray-400">
																			Name:
																		</span>
																		<span className="ml-2 text-white">
																			{coin
																				.token
																				?.name ||
																				"Not available"}
																		</span>
																	</div>
																	<div>
																		<span className="text-gray-400">
																			Address:
																		</span>
																		<span className="ml-2 font-mono text-xs text-white">
																			{coin
																				.token
																				?.address
																				? `${coin.token.address.slice(0, 6)}...${coin.token.address.slice(-4)}`
																				: "Not available"}
																		</span>
																	</div>
																	<div>
																		<span className="text-gray-400">
																			Score:
																		</span>
																		<span className="ml-2 font-bold text-white">
																			{coin.score
																				? coin.score.toFixed(
																						2
																					)
																				: "N/A"}
																		</span>
																	</div>
																	<div>
																		<span className="text-gray-400">
																			Recommendation:
																		</span>
																		<Badge
																			variant="outline"
																			className={`ml-2 ${
																				coin.recommendation ===
																				"BUY"
																					? "border-green-600 text-green-500"
																					: coin.recommendation ===
																						  "SELL"
																						? "border-red-500 text-red-400"
																						: "border-gray-500 text-gray-400"
																			}`}
																		>
																			{coin.recommendation ||
																				"HOLD"}
																		</Badge>
																	</div>
																</div>
															</div>

															{/* Analysis Text */}
															<div>
																<h5 className="mb-2 font-medium text-white">
																	AI Analysis
																</h5>
																<p className="text-sm leading-relaxed text-gray-300">
																	{coin.analysis ||
																		"No analysis available"}
																</p>
															</div>

															{/* Metrics */}
															<div>
																<h5 className="mb-2 font-medium text-white">
																	Metrics
																</h5>
																<div className="space-y-2">
																	{coin.metrics ? (
																		Object.entries(
																			coin.metrics
																		).map(
																			([
																				key,
																				value,
																			]: [
																				string,
																				any,
																			]) => (
																				<div
																					key={
																						key
																					}
																					className="flex justify-between text-sm"
																				>
																					<span className="text-gray-400 capitalize">
																						{key
																							.replace(
																								/([A-Z])/g,
																								" $1"
																							)
																							.toLowerCase()}

																						:
																					</span>
																					<span className="text-white">
																						{typeof value ===
																						"number"
																							? value.toLocaleString()
																							: String(
																									value
																								)}
																					</span>
																				</div>
																			)
																		)
																	) : (
																		<div className="text-sm text-gray-400">
																			No
																			metrics
																			available
																		</div>
																	)}
																</div>
															</div>
														</div>
													</motion.div>
												)
											)}
										</div>
									)}

								{/* Errors Section */}
								{coinData.errors &&
									coinData.errors.length > 0 && (
										<div className="rounded-lg border border-red-800 bg-red-900/20 p-6">
											<h3 className="mb-4 text-xl font-semibold text-red-400">
												Analysis Errors
											</h3>
											<div className="space-y-2">
												{coinData.errors.map(
													(
														error: any,
														index: number
													) => (
														<div
															key={index}
															className="rounded bg-red-900/30 p-3"
														>
															<div className="font-medium text-red-300">
																{error.token}
															</div>
															<div className="text-sm text-red-400">
																{error.error}
															</div>
														</div>
													)
												)}
											</div>
										</div>
									)}

								{/* Parameters Used */}
								{coinData.parameters && (
									<div className="bg-card rounded-lg p-4">
										<h4 className="mb-2 font-medium text-white">
											Analysis Parameters
										</h4>
										<div className="flex gap-4 text-sm">
											<div>
												<span className="text-gray-400">
													Trending Limit:
												</span>
												<span className="ml-1 text-white">
													{
														coinData.parameters
															.trendingLimit
													}
												</span>
											</div>
											<div>
												<span className="text-gray-400">
													New Listings Limit:
												</span>
												<span className="ml-1 text-white">
													{
														coinData.parameters
															.newListingsLimit
													}
												</span>
											</div>
											<div>
												<span className="text-gray-400">
													Analysis Count:
												</span>
												<span className="ml-1 text-white">
													{
														coinData.parameters
															.analysisCount
													}
												</span>
											</div>
										</div>
									</div>
								)}

								{/* Back Button */}
								<div className="flex justify-center pt-6">
									<Button
										onClick={() => {
											setRanAlgo(false);
											setCoinData(null);
										}}
										variant="outline"
										className="border-gray-600 text-gray-300 hover:bg-gray-800"
									>
										Run New Analysis
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
