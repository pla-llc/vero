"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { AuthState } from "@/hooks/use-auth-state";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { authClient } from "@/lib/auth/client";

const ITEMS = [
	{
		label: "Features",
		href: "#",
		dropdownItems: [
			{
				title: "Modern product teams",
				href: "#",
				description:
					"Mainline is built on the habits that make the best product teams successful",
			},
			{
				title: "Resource Allocation",
				href: "#",
				description: "Mainline your resource allocation and execution",
			},
		],
	},
	{ label: "About Us", href: "#" },
	{ label: "Pricing", href: "#" },
	{ label: "FAQ", href: "#" },
	{ label: "Contact", href: "#" },
];

const Navbar = ({ authState }: { authState: AuthState }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);

	return (
		<section className="bg-background/70 absolute left-1/2 top-5 z-50 w-[min(90%,700px)] -translate-x-1/2 rounded-full border backdrop-blur-md lg:top-8">
			<div className="flex items-center justify-between px-6 py-3">
				<Link href="/" className="flex shrink-0 items-center gap-2">
					<img
						src="/brand/transparent-dark-logo-full.svg"
						alt="logo"
						className="mx-2 max-h-[18px]"
					/>
				</Link>

				{/* Desktop Navigation */}
				<NavigationMenu className="max-lg:hidden">
					<NavigationMenuList>
						{ITEMS.map((link) =>
							link.dropdownItems ? (
								<NavigationMenuItem
									key={link.label}
									className=""
								>
									<NavigationMenuTrigger className="bg-transparent! data-[state=open]:bg-accent/50 px-1.5">
										{link.label}
									</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="w-[400px] space-y-2 p-4">
											{link.dropdownItems.map((item) => (
												<li key={item.title}>
													<NavigationMenuLink asChild>
														<a
															href={item.href}
															className="outline-hidden hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group flex select-none gap-4 rounded-md p-3 leading-none no-underline transition-colors"
														>
															<div className="transition-transform duration-300 group-hover:translate-x-1">
																<div className="mb-1 text-sm font-medium leading-none">
																	{item.title}
																</div>
																<p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
																	{
																		item.description
																	}
																</p>
															</div>
														</a>
													</NavigationMenuLink>
												</li>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							) : (
								<NavigationMenuItem
									key={link.label}
									className=""
								>
									<a
										href={link.href}
										className={cn(
											"text-muted-foreground relative bg-transparent px-1.5 text-sm font-medium"
										)}
									>
										{link.label}
									</a>
								</NavigationMenuItem>
							)
						)}
					</NavigationMenuList>
				</NavigationMenu>

				{/* Auth Buttons */}
				<div className="flex items-center gap-2.5">
					{authState.signedIn ? (
						<>
							<DropdownMenu>
								<DropdownMenuTrigger className="cursor-pointer">
									<Avatar>
										<AvatarImage
											src={authState.user.image!}
										/>
										<AvatarFallback>
											{authState.user.name?.charAt(0)}
										</AvatarFallback>
									</Avatar>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem asChild>
										<Link href="/dashboard" className="cursor-pointer">
											Dashboard
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem 
										className="cursor-pointer text-destructive focus:text-destructive"
										onClick={async () => {
											await authClient.signOut({
												fetchOptions: {
													onSuccess: () => {
														window.location.href = "/";
													},
												},
											});
										}}
									>
										Sign out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<>
							<Link href="/login" className="max-lg:hidden">
								<Button variant="outline">
									<span className="relative z-10">Login</span>
								</Button>
							</Link>

							{/* Hamburger Menu Button (Mobile Only) */}
							<button
								className="text-muted-foreground relative flex size-8 lg:hidden"
								onClick={() => setIsMenuOpen(!isMenuOpen)}
							>
								<span className="sr-only">Open main menu</span>
								<div className="absolute left-1/2 top-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
									<span
										aria-hidden="true"
										className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"}`}
									></span>
									<span
										aria-hidden="true"
										className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "opacity-0" : ""}`}
									></span>
									<span
										aria-hidden="true"
										className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"}`}
									></span>
								</div>
							</button>
							<Link
								href="/login"
								className="max-lg:hidden"
							></Link>
						</>
					)}
				</div>
			</div>

			{/*  Mobile Menu Navigation */}
			<div
				className={cn(
					"bg-background fixed inset-x-0 top-[calc(100%+1rem)] flex flex-col rounded-2xl border p-6 transition-all duration-300 ease-in-out lg:hidden",
					isMenuOpen
						? "visible translate-y-0 opacity-100"
						: "invisible -translate-y-4 opacity-0"
				)}
			>
				<nav className="divide-border flex flex-1 flex-col divide-y">
					{ITEMS.map((link) =>
						link.dropdownItems ? (
							<div
								key={link.label}
								className="py-4 first:pt-0 last:pb-0"
							>
								<button
									onClick={() =>
										setOpenDropdown(
											openDropdown === link.label
												? null
												: link.label
										)
									}
									className="text-primary flex w-full items-center justify-between text-base font-medium"
								>
									{link.label}
									<ChevronRight
										className={cn(
											"size-4 transition-transform duration-200",
											openDropdown === link.label
												? "rotate-90"
												: ""
										)}
									/>
								</button>
								<div
									className={cn(
										"overflow-hidden transition-all duration-300",
										openDropdown === link.label
											? "mt-4 max-h-[1000px] opacity-100"
											: "max-h-0 opacity-0"
									)}
								>
									<div className="bg-muted/50 space-y-3 rounded-lg p-4">
										{link.dropdownItems.map((item) => (
											<a
												key={item.title}
												href={item.href}
												className="hover:bg-accent group block rounded-md p-2 transition-colors"
												onClick={() => {
													setIsMenuOpen(false);
													setOpenDropdown(null);
												}}
											>
												<div className="transition-transform duration-200 group-hover:translate-x-1">
													<div className="text-primary font-medium">
														{item.title}
													</div>

													<p className="text-muted-foreground mt-1 text-sm">
														{item.description}
													</p>
												</div>
											</a>
										))}
									</div>
								</div>
							</div>
						) : (
							<a
								key={link.label}
								href={link.href}
								className={cn(
									"text-primary hover:text-primary/80 py-4 text-base font-medium transition-colors first:pt-0 last:pb-0"
								)}
								onClick={() => setIsMenuOpen(false)}
							>
								{link.label}
							</a>
						)
					)}
				</nav>
			</div>
		</section>
	);
};

export { Navbar };
