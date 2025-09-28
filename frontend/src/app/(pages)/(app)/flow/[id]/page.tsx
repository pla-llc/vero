import { createApi } from "@/lib/hono/server";
import { redirect } from "next/navigation";
import NodesContextProvider from "./_components/context";
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

	if (!flow) redirect("/dashboard");
	return (
		<NodesContextProvider flowJson={flow.nodes}>
			<Flow id={id} viewport={flow.viewport} />
		</NodesContextProvider>
	);
}
