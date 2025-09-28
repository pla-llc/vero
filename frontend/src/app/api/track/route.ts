import { createApi } from "@/lib/hono/server";
import prisma from "@backend/lib/prisma";

export const maxDuration = Infinity;
export async function GET(request: Request) {
	console.log("Tracking beginning...");

	const api = await createApi();

	while (true) {
		const res = await api.tracking.updates.$get();
		const trackingData = await res.json();
		if (!trackingData) continue;

		const currentDate = new Date();

		const flows = await prisma.flow.findMany();
		for (const flow of flows) {
			const nodes = JSON.parse(flow.nodes);
			if (flow.nodes) {
				for (const node of nodes.nodes) {
					if (
						node.type === "schedule-trigger" &&
						trackingData.times.includes(node.data.date)
					) {
						const scheduleDate = new Date(node.data.date);
						const diff =
							scheduleDate.getTime() - currentDate.getTime();
						if (diff > 0) continue;

						api.flows.trigger.$post({
							json: {
								id: flow.id,
							},
						});
					}
				}
			}
		}

		await api.tracking.schedule.$delete();

		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	return {};
}
