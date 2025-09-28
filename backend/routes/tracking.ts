import z from "zod";
import { createHono } from "../lib/hono";
import prisma from "../lib/prisma";
import { schemaValidator } from "../lib/validator";

const app = createHono()
	.get("/updates", async (c) => {
		const trackingData = await prisma.trackingData.findUnique({
			where: {
				id: "main",
			},
		});
		return c.json(trackingData);
	})
	.delete("/schedule", async (c) => {
		const trackingData = await prisma.trackingData.findUnique({
			where: {
				id: "main",
			},
		});
		if (!trackingData)
			return c.json({ error: "Tracking data not found" }, 404);

		const currentDate = new Date();
		const newTimes = trackingData.times.filter((time) => {
			return new Date(time).getTime() > currentDate.getTime();
		});

		if (newTimes.length !== trackingData.times.length) {
			console.log("Schedule deleted");
		}

		await prisma.trackingData.update({
			where: {
				id: "main",
			},
			data: {
				times: newTimes,
			},
		});
		return c.json({ message: "Schedule deleted" });
	})
	.post(
		"/schedule",
		schemaValidator(
			"json",
			z.object({
				date: z.string(),
			})
		),
		async (c) => {
			const { date } = c.req.valid("json");
			await prisma.trackingData.update({
				where: {
					id: "main",
				},
				data: {
					times: {
						push: date,
					},
				},
			});
			return c.json({ message: "Schedule added" });
		}
	);

export default app;
