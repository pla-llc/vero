import { Navbar } from "@/components/ui/navbar";
import { PropsWithChildren } from "react";

export default function ProductLayout({ children }: PropsWithChildren) {
	return (
		<div className="flex flex-col">
			<Navbar />
			{children}
		</div>
	);
}
