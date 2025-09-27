import { Navbar } from "@/components/ui/navbar";
import { useAuthState } from "@/hooks/use-auth-state";
import { PropsWithChildren } from "react";

export default async function ProductLayout({ children }: PropsWithChildren) {
	const authState = await useAuthState();

	return (
		<div className="flex flex-col">
			<Navbar authState={authState} />
			{children}
		</div>
	);
}
