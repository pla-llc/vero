import { useAuthState } from "@/hooks/use-auth-state";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function AppLayout({ children }: PropsWithChildren) {
	const { signedIn } = await useAuthState();
	if (!signedIn) {
		redirect("/login");
	}

	return <>{children}</>;
}
