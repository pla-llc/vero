"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeType } from "@/data/node-types";
import { DragEvent, ReactNode } from "react";

export function DraggableNode({ type }: { type: NodeType }): ReactNode {
	const onDragStart = (event: DragEvent, nodeType: NodeType) => {
		event.dataTransfer.setData("application/reactflow", nodeType.id);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className="border-card mb-2 cursor-grab rounded-lg border bg-black p-3 transition-colors hover:bg-[#111111] active:cursor-grabbing"
					onDragStart={(event) => onDragStart(event, type)}
					draggable
				>
					<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
						{type.name}
					</div>
					<div className="truncate text-xs text-gray-500 dark:text-gray-400">
						{type.description}
					</div>
				</div>
			</TooltipTrigger>
			<TooltipContent className="border-card bg-background [&>*]:bg-background border">
				<p className="text-foreground max-w-xs">{type.description}</p>
			</TooltipContent>
		</Tooltip>
	);
}
