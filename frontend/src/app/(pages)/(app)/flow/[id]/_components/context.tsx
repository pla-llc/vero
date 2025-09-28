"use client";

import { Edge, Node } from "@xyflow/react";
import {
	createContext,
	Dispatch,
	SetStateAction,
	useContext,
	useState,
} from "react";

const NodesContext = createContext<{
	nodes: Node[];
	setNodes: Dispatch<SetStateAction<Node[]>>;
	edges: Edge[];
	setEdges: Dispatch<SetStateAction<Edge[]>>;
	setNodeData: (id: string, data: any) => void;
}>({
	nodes: [],
	setNodes: () => {},
	edges: [],
	setEdges: () => {},
	setNodeData: () => {},
});

export function useNodes() {
	return useContext(NodesContext);
}

export default function NodesContextProvider({
	flowJson,
	children,
}: {
	flowJson: string;
	children: React.ReactNode;
}) {
	const flowData = JSON.parse(flowJson);
	const [nodes, setNodes] = useState<Node[]>(flowData.nodes || []);
	const [edges, setEdges] = useState<Edge[]>(flowData.edges || []);

	const setNodeData = (id: string, data: any) => {
		setNodes((nodes) =>
			nodes.map((node) => (node.id === id ? { ...node, data } : node))
		);
	};

	return (
		<NodesContext.Provider
			value={{ nodes, edges, setNodeData, setNodes, setEdges }}
		>
			{children}
		</NodesContext.Provider>
	);
}
