"use client";

import ConvertNode from "@/components/nodes/convert";
import { Card, CardContent } from "@/components/ui/card";
import { DraggableNode } from "@/components/ui/draggable-node";
import { getNodeType, NodeTypes } from "@/data/node-types";
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

			if (!event.dataTransfer) {
				return;
			}

			const type = event.dataTransfer.getData("application/reactflow");

			if (typeof type === "undefined" || !type) {
				return;
			}

			const nodeType = getNodeType(type);
			if (!nodeType) {
				return;
			}

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const newNode: Node = {
				id: generateNodeId(),
				type: nodeType.id,
				position,
				data: {
					label: nodeType.name,
				},
			};

			setNodes((nds) => nds.concat(newNode));
		},
		[screenToFlowPosition]
	);

	const onDragOver = useCallback((event: DragEvent) => {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
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
				nodeTypes={{
					convert: ConvertNode,
				}}
			>
				<Background color="#505050" variant={BackgroundVariant.Dots} />
			</ReactFlow>
			<Card className="absolute top-[50%] left-4 z-50 w-64 -translate-y-1/2">
				<CardContent className="px-4">
					<div className="space-y-2">
						{NodeTypes.map((nodeType, i) => (
							<DraggableNode type={nodeType} key={i} />
						))}
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
