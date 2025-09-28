import { useAuthState } from "@/hooks/use-auth-state";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Navbar } from "@/components/ui/navbar";

export default async function AppLayout({ children }: PropsWithChildren) {
	const { signedIn } = await useAuthState();
	if (!signedIn) {
		redirect("/login");
	}

	const authState = await useAuthState();

	return (
		<div className="min-h-screen bg-background">
			<div className="flex">
				<Sidebar />
				<main className="flex-1 ml-64 min-h-screen pt-16">
					{children}
				</main>
			</div>
		</div>
	);
}
