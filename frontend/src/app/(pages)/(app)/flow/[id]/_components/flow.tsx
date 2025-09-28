"use client";

import ConvertNode from "@/components/nodes/convert";
import ScheduleNode from "@/components/nodes/scheduled";
import SendNode from "@/components/nodes/send";
import { Card, CardContent } from "@/components/ui/card";
import { DraggableNode } from "@/components/ui/draggable-node";
import { getNodeType, NodeTypes } from "@/data/node-types";
import { createClientApi } from "@/lib/hono/client";
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
import { DragEvent, useCallback, useEffect } from "react";
import { useNodes } from "./context";

const generateNodeId = () => {
	return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

function FlowCanvas({ id, viewport }: { id: string; viewport: string }) {
	const { nodes, setNodes, edges, setEdges } = useNodes();
	const { screenToFlowPosition, setViewport, getViewport } = useReactFlow();

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

	useEffect(() => {
		const vp = JSON.parse(viewport);
		console.log(vp);
		if (vp.x && vp.y && vp.zoom) {
			setViewport({
				x: vp.x,
				y: vp.y,
				zoom: vp.zoom,
			});
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
				fitView={false}
				nodeTypes={{
					convert: ConvertNode,
					"schedule-trigger": ScheduleNode,
					send: SendNode,
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
					<button
						onClick={async () => {
							const api = createClientApi();
							const res = await api.flows.save.$post({
								json: {
									nodes,
									edges,
									id,
									viewport: JSON.stringify(getViewport()),
								},
							});
							const data = await res.json();
							console.log(data);
						}}
					>
						save
					</button>
				</CardContent>
			</Card>
		</div>
	);
}

export default function Flow({
	id,
	viewport,
}: {
	id: string;
	viewport: string;
}) {
	return (
		<ReactFlowProvider>
			<FlowCanvas id={id} viewport={viewport} />
		</ReactFlowProvider>
	);
}
