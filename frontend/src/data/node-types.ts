export type NodeType = {
	id: string;
	name: string;
	description: string;
	isTrigger: boolean;
	variables: NodeVariable[];
	onCall: (data: any, uid: string) => Promise<void>;
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
		onCall: async (data, uid) => {
			console.log("Swap trigger called");
		},
	},
	{
		id: "schedule-trigger",
		name: "Scheduled Trigger",
		description: "Trigger the flow at a scheduled time.",
		isTrigger: true,
		variables: [
			{
				name: "date",
				type: "string",
				value: "",
			},
		],
		onCall: async (data, uid) => {
			console.log("Schedule trigger called");
		},
	},
];

export function getNodeType(id: string): NodeType | undefined {
	return NodeTypes.find((nodeType) => nodeType.id === id);
}
