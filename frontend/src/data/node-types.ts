export type NodeType = {
	id: string;
	name: string;
	description: string;
	isTrigger: boolean;
	variables: NodeVariable[];
};

export type NodeVariable =
	| ({} & {
			name: string;
			type: "string";
			value: string;
	  })
	| {
			name: string;
			type: "number";
			value: number;
	  }
	| {
			name: string;
			type: "boolean";
			value: boolean;
	  }
	| {
			name: string;
			type: "coin";
			value: string;
	  };

export type NodeVariableType = "string" | "number" | "boolean" | "coin";

export const NodeTypes: NodeType[] = [
	{
		id: "convert",
		name: "Swap",
		description: "Swap your holdings to a different coin.",
		isTrigger: false,
		variables: [
			{
				name: "from",
				type: "coin",
				value: "SOL",
			},
			{
				name: "to",
				type: "coin",
				value: "USDC",
			},
			{
				name: "amount",
				type: "number",
				value: 0,
			},
			{
				name: "swapType",
				type: "string",
				value: "coin",
			},
		],
	},
	{
		id: "trigger-test",
		name: "Trigger test",
		description: "Trigger test",
		isTrigger: true,
		variables: [],
	},
];

export function getNodeType(id: string): NodeType | undefined {
	return NodeTypes.find((nodeType) => nodeType.id === id);
}
