"use client";

import Form, { SubmitButton } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClientApi } from "@/lib/hono/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateFlowPage() {
	const [name, setName] = useState("");
	const router = useRouter();

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
