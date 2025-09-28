"use client";

import { cn } from "@/lib/utils";
import {
	ArrowLeftRight,
	ChevronRight,
	LayoutDashboard,
	Settings,
	TrendingUp,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { Separator } from "./separator";

const sidebarItems = [
	{
		title: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		description: "Portfolio overview",
	},
	{
		title: "Swap",
		href: "/swap",
		icon: ArrowLeftRight,
		description: "Trade tokens",
	},
	{
		title: "Flows",
		href: "/flows",
		icon: Workflow,
		describe: "Create and manage your flows",
	},
	{
		title: "Analytics",
		href: "/analytics",
		icon: TrendingUp,
		description: "Performance data",
	},
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<div className="bg-card border-border fixed top-0 left-0 z-40 h-full w-64 border-r">
			<div className="flex h-full flex-col">
				{/* Header */}
				<div className="px-6 py-6">
					<div className="mb-2 flex items-center gap-2">
						<img
							src="/brand/transparent-dark-logo-full.svg"
							alt="logo"
							className="h-8"
						/>
					</div>
				</div>

				<Separator />

				{/* Navigation */}
				<nav className="flex-1 space-y-1 px-4 py-4">
					{sidebarItems.map((item) => {
						const isActive = pathname === item.href;
						const Icon = item.icon;

						return (
							<Link key={item.href} href={item.href}>
								<Button
									variant={isActive ? "secondary" : "ghost"}
									className={cn(
										"group h-12 w-full justify-start gap-3 px-3",
										isActive &&
											"bg-primary/10 text-primary border-primary/20"
									)}
								>
									<Icon className="h-5 w-5" />
									<div className="flex-1 text-left">
										<div className="text-sm font-medium">
											{item.title}
										</div>
										<div className="text-muted-foreground group-hover:text-foreground text-xs transition-colors">
											{item.description}
										</div>
									</div>
									{isActive && (
										<ChevronRight className="text-primary h-4 w-4" />
									)}
								</Button>
							</Link>
						);
					})}
				</nav>

				<Separator />

				{/* Footer */}
				<div className="p-4">
					<Button
						variant="ghost"
						className="w-full justify-start gap-3"
						asChild
					>
						<Link href="/settings">
							<Settings className="h-5 w-5" />
							<span>Settings</span>
						</Link>
					</Button>
				</div>

				{/* Bottom accent */}
				<div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" />
			</div>
		</div>
	);
}
