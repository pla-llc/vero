"use client";

import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { RefObject, useRef, useState } from "react";
import { Button, buttonVariants } from "../ui/button";

export default function Form({
	action,
	submitOnEnter = true,
	children,
	className,
	...props
}: {
	action: (data: FormData) => Promise<void>;
	submitOnEnter?: boolean;
	children: (
		ref: RefObject<HTMLFormElement | null>,
		loading: boolean,
		setLoading: (loading: boolean) => void
	) => any;
	className?: string;
}) {
	const ref = useRef<HTMLFormElement>(null);
	const [loading, setLoading] = useState(false);

	return (
		<form
			ref={ref}
			{...props}
			action={async (data: FormData) => {
				await action(data);
				setLoading(false);
			}}
			className={className}
			onKeyDown={(e) => {
				if (e.key === "Enter" && !loading && submitOnEnter) {
					e.preventDefault();
					setLoading(true);
					ref.current?.requestSubmit();
				}
			}}
		>
			{children(ref, loading, setLoading)}
		</form>
	);
}

export function SubmitButton({
	variant,
	size,
	className,
	loading,
	setLoading,
	formRef,
	disabled,
	children,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	} & {
		loading: boolean;
		setLoading: (loading: boolean) => void;
		formRef: RefObject<HTMLFormElement | null>;
	}) {
	return (
		<Button
			className={cn(
				buttonVariants({ variant, size, className }),
				"transition-all duration-300 ease-in-out"
			)}
			disabled={loading || disabled}
			{...props}
			onClick={(e) => {
				e.preventDefault();
				setLoading(true);
				formRef.current?.requestSubmit();
			}}
			type="button"
		>
			{loading && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.15 }}
				>
					<Loader2 className="animate-spin" />
				</motion.div>
			)}
			{children}
		</Button>
	);
}
