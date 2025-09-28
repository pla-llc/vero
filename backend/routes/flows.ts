import z from "zod";
import { createProtectedHono } from "../lib/hono";
import prisma from "../lib/prisma";
import { schemaValidator } from "../lib/validator";

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
			})
		),
		async (c) => {
			const { name } = c.req.valid("json");

			const flow = await prisma.flow.create({
				data: {
					name,
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

			return c.json({});
		}
	);

export default app;
