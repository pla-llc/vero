"use client";

import { useNodes } from "@/app/(pages)/(app)/flow/[id]/_components/context";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Node, NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import BasicNode from "./basic-node";
import CoinVariable from "./variables/coin";

export default function ConvertNode(props: NodeProps<Node<{}>>) {
	const { nodes, setNodeData } = useNodes();
	const [node, setNode] = useState(
		nodes.find((node) => node.id === props.id)
	);
	const [fromTokenBalance, setFromTokenBalance] = useState<number | null>(null);
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);

	useEffect(() => {
		if (!node) return;

		const coinData = node.data;
		if (!node.data.fromCoin) {
			coinData.fromCoin = "SOL";
		}
		if (!node.data.toCoin) {
			coinData.toCoin = "USDC";
		}
		if (!node.data.amount) {
			coinData.amount = 1;
		}
		if (!node.data.swapType) {
			coinData.swapType = "Coin";
		}
		setNodeData(props.id, coinData);
	}, []);

	useEffect(() => {
		setNode(nodes.find((node) => node.id === props.id));
	}, [nodes]);

	// Fetch balance for the selected fromCoin
	useEffect(() => {
		const fetchBalance = async () => {
			if (!node?.data.fromCoin) return;
			
			setIsLoadingBalance(true);
			try {
				const response = await fetch(`http://localhost:3001/api/wallet/balance/${node.data.fromCoin}`, {
					credentials: "include",
				});
				
				if (response.ok) {
					const data = await response.json();
					setFromTokenBalance(data.balance);
				} else {
					setFromTokenBalance(null);
				}
			} catch (error) {
				console.error("Error fetching balance:", error);
				setFromTokenBalance(null);
			} finally {
				setIsLoadingBalance(false);
			}
		};

		fetchBalance();
	}, [node?.data.fromCoin]);

	if (!node) return null;
	return (
		<BasicNode id="convert">
			<div className="flex w-full flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="font-medium">Swap</span>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<label className="text-muted-foreground text-xs">
								From:
							</label>
							<CoinVariable
								placeholder="Select coin..."
								value={(node.data.fromCoin as string) || "SOL"}
								onValueChange={(value) =>
									setNodeData(props.id, {
										...node.data,
										fromCoin: value,
									})
								}
							/>
						</div>
						{(node.data.fromCoin as string) && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Balance:</span>
								<span className="text-xs">
									{isLoadingBalance ? (
										"Loading..."
									) : fromTokenBalance !== null ? (
										`${fromTokenBalance.toFixed(4)}`
									) : (
										"--"
									)}
								</span>
							</div>
						)}
					</div>
					<div className="flex items-center justify-between">
						<label className="text-muted-foreground text-xs">
							To:
						</label>
						<CoinVariable
							placeholder="Select coin..."
							value={(node.data.toCoin as string) || "USDC"}
							onValueChange={(value) =>
								setNodeData(props.id, {
									...node.data,
									toCoin: value,
								})
							}
						/>
					</div>
					<div className="flex items-center gap-1">
						<Input
							type="number"
							placeholder="1"
							value={
								Math.max(node.data.amount as number, 0.001) || 1
							}
							onChange={(e) =>
								setNodeData(props.id, {
									...node.data,
									amount: e.target.value,
								})
							}
							className="h-8 flex-1 text-xs"
							min={0.01}
							step={0.1}
						/>
						<Select
							value={(node.data.swapType as string) || "Coin"}
							onValueChange={(value) => {
								setNodeData(props.id, {
									...node.data,
									swapType: value,
								});
							}}
						>
							<SelectTrigger
								size="sm"
								className="h-8 w-fit min-w-[90px] px-2 text-xs"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={"coin"}>
									{(node.data.fromCoin as string) || "Coin"}
								</SelectItem>
								<SelectItem value="%">%</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</BasicNode>
	);
}
