"use client";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Node, NodeProps } from "@xyflow/react";
import * as React from "react";
import BasicNode from "./basic-node";
import CoinVariable from "./variables/coin";

export default function ConvertNode(props: NodeProps<Node<{}>>) {
	const [fromCoin, setFromCoin] = React.useState("SOL");
	const [toCoin, setToCoin] = React.useState("USDC");
	const [amount, setAmount] = React.useState("");
	const [unit, setUnit] = React.useState("%");

	return (
		<BasicNode id="convert">
			<div className="flex w-full flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="font-medium">Swap</span>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<label className="text-muted-foreground text-xs">
							From:
						</label>
						<CoinVariable
							placeholder="Select coin..."
							value={fromCoin}
							onValueChange={setFromCoin}
						/>
					</div>
					<div className="flex items-center justify-between">
						<label className="text-muted-foreground text-xs">
							To:
						</label>
						<CoinVariable
							placeholder="Select coin..."
							value={toCoin}
							onValueChange={setToCoin}
						/>
					</div>
					<div className="flex items-center gap-1">
						<Input
							type="number"
							placeholder="0"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="h-8 flex-1 text-xs"
						/>
						<Select value={unit} onValueChange={setUnit}>
							<SelectTrigger
								size="sm"
								className="h-8 w-fit px-2 text-xs"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={fromCoin}>
									{fromCoin}
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
