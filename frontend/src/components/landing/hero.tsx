"use client";

import { Blocks, Brain, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero({ signedIn }: { signedIn: boolean }) {
	return (
		<section className="relative py-32">
			<div className="container pt-[88px]">
				<div className="text-center">
					<h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-semibold lg:mb-7 lg:text-7xl">
						Start managing your crypto, offline
					</h1>
					<p className="m text-muted-foreground mx-auto max-w-3xl lg:text-xl">
						Vero makes it easy for
						<span className="text-primary relative top-[5px] mx-2 inline-flex font-medium md:top-[3px]">
							<User className="mr-1 w-4 md:w-5" />
							Individuals
						</span>
						to manage their
						<span className="text-primary relative top-[5px] mx-2 inline-flex font-medium md:top-[3px]">
							<Brain className="mr-1 w-5" />
							Complex
						</span>
						wallets
						<span className="text-primary relative top-[5px] mx-2 inline-flex font-medium md:top-[3px]">
							<Blocks className="mr-1 w-5" />
							Simply
						</span>
						, hands-free.
					</p>
					<div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
						<Link href={signedIn ? "/dashboard" : "/login"}>
							<Button size="lg">
								{signedIn
									? "Go to dashboard"
									: "Get started for free"}
							</Button>
						</Link>
						<Button size="lg" variant="ghost">
							Learn more
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Illustration1 = (props: any) => {
	return (
		<motion.svg
			xmlns="http://www.w3.org/2000/svg"
			width={460}
			height={233}
			fill="none"
			{...props}
		>
			<path stroke="url(#a)" d="M141.338 232.625V5.075" />
			<path stroke="url(#b)" d="M176.338 232.625V5.075" />
			<path stroke="url(#c)" d="M212.338 231.625V4.075" />
			<path stroke="url(#d)" d="M248.338 230.625V3.075" />
			<path stroke="url(#e)" d="M284.338 229.625V2.075" />
			<path stroke="url(#f)" d="M320.338 228.625V1.075" />
			<path
				stroke="url(#g)"
				d="M459.649 152.723 351.613 69.264a11 11 0 0 1-4.275-8.705V.074"
			/>
			<path
				stroke="url(#h)"
				d="m.338 152.723 108.036-83.459a11 11 0 0 0 4.275-8.705V.074"
			/>
			<defs>
				<linearGradient
					id="a"
					x1={141.838}
					x2={141.838}
					y1={232.625}
					y2={5.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="b"
					x1={176.838}
					x2={176.838}
					y1={232.625}
					y2={5.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="c"
					x1={212.838}
					x2={212.838}
					y1={231.625}
					y2={4.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="d"
					x1={248.838}
					x2={248.838}
					y1={230.625}
					y2={3.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="e"
					x1={284.838}
					x2={284.838}
					y1={229.625}
					y2={2.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="f"
					x1={320.838}
					x2={320.838}
					y1={228.625}
					y2={1.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="g"
					x1={403.494}
					x2={403.494}
					y1={152.723}
					y2={0.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
				<linearGradient
					id="h"
					x1={56.494}
					x2={56.494}
					y1={152.723}
					y2={0.074}
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#fff" />
					<stop offset={1} stopColor="#999" />
				</linearGradient>
			</defs>
		</motion.svg>
	);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Illustration2 = (props: any) => {
	return (
		<motion.svg
			{...props}
			width="200"
			height="444"
			viewBox="0 0 323 444"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M0 442.957L209.048 442.957C212.366 442.957 215.508 441.458 217.596 438.879L321.802 310.196"
				stroke="url(#paint0_linear_290_207)"
			/>
			<path
				d="M0 1.19531L209.048 1.19557C212.366 1.19558 215.508 2.69391 217.596 5.27302L321.802 133.956"
				stroke="url(#paint1_linear_290_207)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_290_207"
					x1="160.901"
					y1="442.957"
					x2="160.901"
					y2="310.196"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#999999" />
					<stop offset="1" stopColor="white" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_290_207"
					x1="160.901"
					y1="1.19531"
					x2="160.901"
					y2="133.956"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#999999" />
					<stop offset="1" stopColor="white" />
				</linearGradient>
			</defs>
		</motion.svg>
	);
};
