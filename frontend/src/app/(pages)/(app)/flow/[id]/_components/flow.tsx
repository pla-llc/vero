"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flow as FlowType } from "@generated/client";
import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	BackgroundVariant,
	Connection,
	Edge,
	EdgeChange,
	Node,
	NodeChange,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DragEvent, useCallback, useState } from "react";

const generateNodeId = () => {
	return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const DraggableNode = ({ type, label }: { type: string; label: string }) => {
	const onDragStart = (event: DragEvent, nodeType: string) => {
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<div
			className="mb-2 cursor-grab rounded-lg border bg-white p-3 transition-colors hover:bg-gray-50 active:cursor-grabbing dark:bg-gray-800 dark:hover:bg-gray-700"
			onDragStart={(event) => onDragStart(event, type)}
			draggable
		>
			<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
				{label}
			</div>
			<div className="text-xs text-gray-500 dark:text-gray-400">
				Drag to add to flow
			</div>
		</div>
	);
};

function FlowCanvas({ flow }: { flow: FlowType }) {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const { screenToFlowPosition } = useReactFlow();

	const onNodesChange = useCallback(
		(changes: NodeChange[]) =>
			setNodes((nodesSnapshot: Node[]) =>
				applyNodeChanges(changes, nodesSnapshot)
			),
		[]
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) =>
			setEdges((edgesSnapshot: Edge[]) =>
				applyEdgeChanges(changes, edgesSnapshot)
			),
		[]
	);
	const onConnect = useCallback(
		(params: Connection) =>
			setEdges((edgesSnapshot: Edge[]) => addEdge(params, edgesSnapshot)),
		[]
	);

	const onDrop = useCallback(
		(event: DragEvent) => {
			event.preventDefault();

			const type = event.dataTransfer.getData("application/reactflow");

			if (typeof type === "undefined" || !type) {
				return;
			}

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const newNode: Node = {
				id: generateNodeId(),
				type: "default",
				position,
				data: {
					label: type === "text" ? "Text Node" : "Action Node",
				},
			};

			setNodes((nds) => nds.concat(newNode));
		},
		[screenToFlowPosition]
	);

	const onDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	return (
		<div className="relative h-screen w-screen">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onDrop={onDrop}
				onDragOver={onDragOver}
				colorMode="dark"
				fitView
			>
				<Background color="#505050" variant={BackgroundVariant.Dots} />
			</ReactFlow>
			<Card className="absolute top-[50%] left-4 z-50 w-48 -translate-y-1/2">
				<CardContent className="p-4">
					<div className="space-y-2">
						<div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
							Node Types
						</div>
						<DraggableNode type="text" label="Text Node" />
						<DraggableNode type="action" label="Action Node" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function Flow({ flow }: { flow: FlowType }) {
	return (
		<ReactFlowProvider>
			<FlowCanvas flow={flow} />
		</ReactFlowProvider>
	);
}
