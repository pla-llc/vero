import { createApi } from "@/lib/hono/server";

export const maxDuration = Infinity;
export async function GET(request: Request) {
	console.log("Tracking beginning...");

	const api = await createApi();

	while (true) {
		const res = await api.tracking.updates.$get();
		const trackingData = await res.json();
		if (!trackingData) continue;

		const currentDate = new Date();
		for (const schedule of trackingData.times) {
			const scheduleDate = new Date(schedule);
			if (scheduleDate < currentDate) continue;

			const diff = scheduleDate.getTime() - currentDate.getTime();
			if (diff < 0) continue;

			// trigger the flow
		}

		await api.tracking.schedule.$delete();

		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	return {};
}
