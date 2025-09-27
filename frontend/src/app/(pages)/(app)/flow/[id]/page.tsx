import { createApi } from "@/lib/hono/server";
import Flow from "./_components/flow";

export default async function FlowPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const api = await createApi();
	const res = await api.flows.$get({
		query: {
			id,
		},
	});
	const flow = await res.json();

	return <Flow flow={flow} />;
}
