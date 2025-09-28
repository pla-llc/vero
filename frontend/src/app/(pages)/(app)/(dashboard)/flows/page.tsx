import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createApi } from "@/lib/hono/server";
import {
	Activity,
	Calendar,
	Clock,
	ExternalLink,
	PlayCircle,
	Plus,
	Settings,
	Workflow,
} from "lucide-react";
import Link from "next/link";

interface Flow {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	triggeredAt?: string;
	nodes: string;
	viewport: string;
	userId: string;
}

export default async function FlowsPage() {
	const api = await createApi();
	const res = await api.flows.all.$get();
	const data = await res.json();

	// Handle potential error response
	const flowsArr: any[] = Array.isArray(data) ? data : [];
	const flows: Flow[] = flowsArr.map((flow) => ({
		...flow,
		createdAt: new Date(flow.createdAt),
		updatedAt: new Date(flow.updatedAt),
		triggeredAt: flow.triggeredAt ? new Date(flow.triggeredAt) : null,
	}));

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatRelativeTime = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return `${Math.floor(diffDays / 30)} months ago`;
	};

	const getNodeCount = (nodesString: string) => {
		try {
			const parsed = JSON.parse(nodesString);
			return parsed.nodes?.length || 0;
		} catch {
			return 0;
		}
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Flows</h1>
					<p className="text-muted-foreground">
						Create and manage your automated workflows
					</p>
				</div>
				<Button asChild>
					<Link href="/create/flow">
						<Plus className="mr-2 h-4 w-4" />
						Create Flow
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			{flows.length > 0 && (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					<Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Flows
							</CardTitle>
							<Workflow className="h-4 w-4 text-blue-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
								{flows.length}
							</div>
							<p className="text-xs text-blue-600 dark:text-blue-400">
								{flows.filter((f) => f.triggeredAt).length}{" "}
								triggered
							</p>
						</CardContent>
					</Card>

					<Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Active Flows
							</CardTitle>
							<Activity className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-700 dark:text-green-300">
								{
									flows.filter(
										(f) => getNodeCount(f.nodes) > 0
									).length
								}
							</div>
							<p className="text-xs text-green-600 dark:text-green-400">
								With configured nodes
							</p>
						</CardContent>
					</Card>

					<Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Recent Activity
							</CardTitle>
							<Clock className="h-4 w-4 text-purple-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
								{
									flows.filter((f) => {
										if (!f.triggeredAt) return false;
										const daysSince = Math.floor(
											(Date.now() -
												new Date(
													f.triggeredAt
												).getTime()) /
												(1000 * 60 * 60 * 24)
										);
										return daysSince <= 7;
									}).length
								}
							</div>
							<p className="text-xs text-purple-600 dark:text-purple-400">
								Triggered this week
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Flows List */}
			{flows.length > 0 ? (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Workflow className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Your Flows</h2>
					</div>

					<div className="grid gap-4">
						{flows.map((flow) => {
							const nodeCount = getNodeCount(flow.nodes);
							const hasBeenTriggered = !!flow.triggeredAt;

							return (
								<Card
									key={flow.id}
									className="transition-shadow duration-200 hover:shadow-md"
								>
									<CardContent className="px-6 py-2">
										<div className="flex items-start justify-between">
											<div className="flex-1 space-y-3">
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
														<Workflow className="h-5 w-5 text-white" />
													</div>
													<div>
														<h3 className="text-lg font-semibold">
															{flow.name}
														</h3>
														{flow.description && (
															<p className="text-muted-foreground text-sm">
																{
																	flow.description
																}
															</p>
														)}
													</div>
												</div>

												<div className="text-muted-foreground flex items-center gap-4 text-sm">
													<div className="flex items-center gap-1">
														<Settings className="h-4 w-4" />
														<span>
															{nodeCount} node
															{nodeCount !== 1
																? "s"
																: ""}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<Calendar className="h-4 w-4" />
														<span>
															Created{" "}
															{formatDate(
																flow.createdAt
															)}
														</span>
													</div>
													{hasBeenTriggered && (
														<div className="flex items-center gap-1">
															<PlayCircle className="h-4 w-4" />
															<span>
																Last run{" "}
																{formatRelativeTime(
																	flow.triggeredAt!
																)}
															</span>
														</div>
													)}
												</div>

												<div className="flex items-center gap-2">
													<Badge
														variant={
															nodeCount > 0
																? "default"
																: "secondary"
														}
													>
														{nodeCount > 0
															? "Configured"
															: "Draft"}
													</Badge>
													{hasBeenTriggered && (
														<Badge
															variant="outline"
															className="border-green-600 text-green-600"
														>
															Active
														</Badge>
													)}
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													asChild
												>
													<Link
														href={`/flow/${flow.id}`}
													>
														<ExternalLink className="mr-1 h-4 w-4" />
														Open
													</Link>
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			) : (
				/* Empty State */
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
							<Workflow className="h-10 w-10 text-white" />
						</div>
						<h3 className="mb-2 text-xl font-semibold">
							No flows yet
						</h3>
						<p className="text-muted-foreground mb-6 max-w-md text-center">
							Create your first automated workflow to start
							building powerful trading strategies and portfolio
							management tools.
						</p>
						<Button asChild>
							<Link href="/create/flow">
								<Plus className="mr-2 h-4 w-4" />
								Create Your First Flow
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
