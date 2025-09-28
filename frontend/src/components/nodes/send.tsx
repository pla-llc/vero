"use client";

import { useNodes } from "@/app/(pages)/(app)/flow/[id]/_components/context";
import { Node, NodeProps } from "@xyflow/react";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import BasicNode from "./basic-node";
import CoinVariable from "./variables/coin";

export default function SendNode(props: NodeProps<Node<{}>>) {
	const { nodes, setNodeData } = useNodes();
	const [node, setNode] = useState(
		nodes.find((node) => node.id === props.id)
	);

	useEffect(() => {
		if (!node) return;

		if (!node.data.amount) {
			node.data.fromCoin = 0.001;
		}
	}, []);

	useEffect(() => {
		setNode(nodes.find((node) => node.id === props.id));
	}, [nodes]);

	if (!node) return null;
	return (
		<BasicNode id="send">
			<div className="flex w-full flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="font-medium">Send</span>
				</div>
				<div className="flex items-center justify-between">
					<label className="text-muted-foreground text-xs">
						Coin to send:
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
				<Input
					placeholder="To Address"
					value={(node.data.toAddress as string) || ""}
					onChange={(e) =>
						setNodeData(props.id, {
							...node.data,
							toAddress: e.target.value,
						})
					}
				/>
				<Input
					placeholder="Amount"
					value={(node.data.amount as number) || 0.001}
					onChange={(e) =>
						setNodeData(props.id, {
							...node.data,
							amount: e.target.value,
						})
					}
					type="number"
					min={0.001}
				/>
			</div>
		</BasicNode>
	);
}
