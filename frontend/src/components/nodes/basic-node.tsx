import { getNodeType } from "@/data/node-types";
import { Handle, Position } from "@xyflow/react";
import React from "react";

export default function BasicNode({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) {
	const nodeType = getNodeType(id)!;

	return (
		<div className="bg-card border-card-foreground/10 flex w-fit min-w-56 flex-col items-center justify-center gap-2 rounded-lg border p-4">
			{children}
			{!nodeType.isTrigger && (
				<Handle type="target" position={Position.Top} />
			)}
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
}
