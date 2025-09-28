"use client";

import Form, { SubmitButton } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { createClientApi } from "@/lib/hono/client";
import { Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateFlowPage() {
	const [name, setName] = useState("");
	const router = useRouter();

	const { data: session, isPending } = authClient.useSession();

	if (isPending)
		return (
			<div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-black">
				<Loader2 className="h-10 w-10 animate-spin text-white" />
			</div>
		);
	if (!session) {
		redirect("/login");
	}
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center gap-6">
			<img
				src="/brand/transparent-dark-logo-full.svg"
				alt="logo"
				className="h-7"
			/>
			<Form
				className="flex w-full max-w-md flex-col gap-2 px-8"
				action={async () => {
					const api = createClientApi();
					const res = await api.flows.$post({
						json: {
							name,
							userId: session.user.id!,
						},
					});
					const { id } = await res.json();
					router.push(`/flow/${id}`);
				}}
			>
				{(ref, loading, setLoading) => (
					<>
						<Input
							placeholder="My new flow"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<SubmitButton
							loading={loading}
							setLoading={setLoading}
							formRef={ref}
							className="w-full"
						>
							Create Flow
						</SubmitButton>
					</>
				)}
			</Form>
		</div>
	);
}
