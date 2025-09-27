"use client";

import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Form, { SubmitButton } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import OAuth from "./oauth";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<section className="bg-background h-screen">
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-6 lg:justify-start">
					<div className="min-w-sm flex w-full max-w-sm flex-col items-center gap-y-4 px-6 py-12">
						{/* Logo */}
						<Link
							href={process.env.NEXT_PUBLIC_BASE_URL!}
							className="mb-6"
						>
							<img
								src="/brand/transparent-dark-logo-full.svg"
								alt="logo"
								className="h-10"
							/>
						</Link>
						<Form
							action={async () => {
								if (!email || !password) {
									toast.error("Please fill in all fields");
									return;
								}
								const { error } = await authClient.signIn.email(
									{
										email,
										password,
									}
								);
								if (error) {
									toast.error(error.message);
									return;
								}

								redirect("/dashboard");
							}}
							className="min-w-sm flex w-full max-w-sm flex-col items-center gap-y-4 px-6"
						>
							{(ref, loading, setLoading) => (
								<>
									<div className="flex w-full flex-col gap-2">
										<Label>Email</Label>
										<Input
											type="email"
											placeholder="Email"
											className="text-sm"
											value={email}
											onChange={(e) =>
												setEmail(e.target.value)
											}
										/>
									</div>
									<div className="flex w-full flex-col gap-2">
										<Label>Password</Label>
										<Input
											type="password"
											placeholder="Password"
											className="text-sm"
											value={password}
											onChange={(e) =>
												setPassword(e.target.value)
											}
										/>
									</div>
									<SubmitButton
										loading={loading}
										setLoading={setLoading}
										formRef={ref}
										className="w-full"
									>
										Login
									</SubmitButton>
								</>
							)}
						</Form>
						<OAuth />
						<div className="text-muted-foreground flex justify-center gap-1 text-sm">
							<p>Need an account?</p>
							<Link
								href="/register"
								className="text-primary font-medium hover:underline"
							>
								Sign up
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export { Login };
