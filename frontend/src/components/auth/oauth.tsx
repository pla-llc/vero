"use client";

import { authClient } from "@/lib/auth/client";
import { Button } from "../ui/button";

export default function OAuth() {
	return (
		<div className="flex w-full flex-col gap-2">
			<Button
				className="w-full"
				variant="outline"
				onClick={async () => {
					await authClient.signIn.social({
						provider: "google",
						callbackURL: process.env.NEXT_PUBLIC_BASE_URL!,
					});
				}}
			>
				<img
					src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/google-icon.svg"
					className="size-5"
					alt="Google"
				/>
				Google
			</Button>
		</div>
	);
}
