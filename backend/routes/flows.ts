import { getNodeType } from "@frontend/data/node-types";
import z from "zod";
import { createProtectedHono } from "../lib/hono";
import prisma from "../lib/prisma";
import { schemaValidator } from "../lib/validator";

async function callNode(nodeId: any, nodes: any, edges: any, data: any) {
	const node = nodes.find((node: any) => node.id === nodeId);
	if (!node) return;

	const nodeType = getNodeType(node.type);
	if (!nodeType) return;

	await nodeType.onCall(data);

	const edge = edges.find((edge: any) => edge.source === nodeId);
	if (!edge) return;

	const nextNodeId = edge.target;
	const nextNode = nodes.find((node: any) => node.id === nextNodeId);
	if (!nextNode) return;

	await callNode(nextNodeId, nodes, edges, nextNode.data);
}

const app = createProtectedHono()
	.get(
		"/",
		schemaValidator(
			"query",
			z.object({
				id: z.string(),
			})
		),
		async (c) => {
			const query = c.req.valid("query");
			const flow = await prisma.flow.findUnique({
				where: {
					id: query.id,
				},
			});
			return c.json(flow);
		}
	)
	.post(
		"/",
		schemaValidator(
			"json",
			z.object({
				name: z.string(),
				userId: z.string(),
			})
		),
		async (c) => {
			const { name, userId } = c.req.valid("json");

			const flow = await prisma.flow.create({
				data: {
					name,
					userId,
				},
			});
			return c.json(flow);
		}
	)
	.post(
		"/trigger",
		schemaValidator(
			"json",
			z.object({
				id: z.string(),
			})
		),
		async (c) => {
			const { id } = c.req.valid("json");

			const flow = await prisma.flow.findUnique({
				where: {
					id,
				},
			});
			if (!flow) return c.json({ error: "Flow not found" }, 404);

			const nodes = JSON.parse(flow.nodes);
			let triggerNode;
			for (const node of nodes.nodes) {
				if ((node.type as string).includes("trigger")) {
					triggerNode = node;
					break;
				}
			}
			if (!triggerNode)
				return c.json({ error: "Trigger node not found" }, 404);

			const edges = nodes.edges;
			await callNode(
				triggerNode.id,
				nodes.nodes,
				edges,
				triggerNode.data
			);

			return c.json({});
		}
	)
	.post(
		"/save",
		schemaValidator(
			"json",
			z.object({
				id: z.string(),
				nodes: z.array(z.any()),
				edges: z.array(z.any()),
				viewport: z.string(),
			})
		),
		async (c) => {
			const { id, nodes, edges, viewport } = c.req.valid("json");
			const nodesJson = JSON.stringify({
				nodes,
				edges,
			});

			await prisma.flow.update({
				where: {
					id,
				},
				data: {
					nodes: nodesJson,
					viewport,
				},
			});

			nodes.forEach(async (node) => {
				if (node.type === "schedule-trigger") {
					await prisma.trackingData.update({
						where: {
							id: "main",
						},
						data: {
							times: {
								push: node.data.date,
							},
						},
					});
				}
			});

			return c.json({ message: "Flow saved" });
		}
	);

export default app;
