"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

export interface Coin {
	id: string;
	name: string;
	symbol: string;
	contractAddress?: string;
	icon?: string;
}

const defaultCoins: Coin[] = [
	{
		id: "solana",
		name: "Solana",
		symbol: "SOL",
		contractAddress: "So11111111111111111111111111111111111111112",
		icon: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
	},
	{
		id: "usd-coin",
		name: "USD Coin",
		symbol: "USDC",
		contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circle_USDC_Logo.svg/1200px-Circle_USDC_Logo.svg.png",
	},
];

interface CoinVariableProps {
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export default function CoinVariable({
	value,
	onValueChange,
	placeholder = "Select a coin...",
	className,
}: CoinVariableProps) {
	const [open, setOpen] = React.useState(false);
	const [searchTerm, setSearchTerm] = React.useState("");
	const [searchResults, setSearchResults] = React.useState<Coin[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);

	const selectedCoin = [...defaultCoins, ...searchResults].find(
		(coin) => coin.contractAddress === value || coin.id === value
	);

	// Debounced search function for Solana tokens
	const searchTokens = React.useCallback(async (query: string) => {
		if (!query.trim() || query.length < 2) {
			setSearchResults([]);
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`http://localhost:3001/api/birdeye/search/${encodeURIComponent(query)}`
			);
			if (response.ok) {
				const data = await response.json();
				const tokens =
					data.tokens?.map((token: any) => ({
						id: token.address,
						name: token.name,
						symbol: token.symbol,
						contractAddress: token.address,
						icon: token.icon,
					})) || [];
				setSearchResults(tokens);
			}
		} catch (error) {
			console.error("Error searching tokens:", error);
			setSearchResults([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Debounce search
	React.useEffect(() => {
		const timer = setTimeout(() => {
			if (searchTerm && searchTerm.length >= 2) {
				searchTokens(searchTerm);
			} else {
				setSearchResults([]);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm, searchTokens]);

	const allCoins = searchTerm ? searchResults : defaultCoins;

	const handleSelect = (coin: Coin) => {
		onValueChange?.(coin.contractAddress!);
		setOpen(false);
		setSearchTerm("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					role="combobox"
					aria-expanded={open}
					className={cn("w-[90px] justify-between", className)}
				>
					{selectedCoin ? (
						<div className="flex min-w-0 flex-1 items-center gap-1.5">
							<img
								src={selectedCoin.icon}
								className="h-3 w-3 flex-shrink-0 rounded-full"
							/>
							<span className="truncate text-xs">
								{selectedCoin.symbol}
							</span>
						</div>
					) : (
						<span className="text-muted-foreground truncate text-xs">
							{placeholder}
						</span>
					)}
					<ChevronDownIcon className="ml-1 h-3 w-3 shrink-0 opacity-50" />
				</Button>
			</DialogTrigger>
			<DialogContent className="w-[240px] p-0" showCloseButton={false}>
				<DialogTitle></DialogTitle>
				<Command>
					<CommandInput
						placeholder="Search Solana tokens..."
						value={searchTerm}
						onValueChange={setSearchTerm}
						className="h-7 text-xs"
					/>
					<CommandList className="max-h-[160px]">
						{isLoading ? (
							<div className="text-muted-foreground py-3 text-center text-xs">
								Searching...
							</div>
						) : allCoins.length === 0 ? (
							<CommandEmpty className="py-3 text-xs">
								{searchTerm
									? "No tokens found."
									: "Type to search Solana tokens..."}
							</CommandEmpty>
						) : (
							<CommandGroup
								heading={
									searchTerm
										? "Search Results"
										: "Popular Tokens"
								}
							>
								{allCoins.map((coin) => (
									<CommandItem
										key={coin.id}
										value={coin.id}
										onSelect={() => handleSelect(coin)}
										className="flex items-center gap-1.5 px-1.5 py-1"
									>
										<img
											src={coin.icon}
											className="h-4 w-4 flex-shrink-0 rounded-full"
											alt={coin.name}
										/>
										<div className="flex min-w-0 flex-1 flex-col">
											<div className="flex min-w-0 items-center gap-1">
												<span className="text-xs font-medium">
													{coin.symbol}
												</span>
												<span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
													{coin.name}
												</span>
											</div>
											{coin.contractAddress && (
												<span className="text-muted-foreground truncate text-xs opacity-70">
													{coin.contractAddress.slice(
														0,
														6
													)}
													...
													{coin.contractAddress.slice(
														-3
													)}
												</span>
											)}
										</div>
										<CheckIcon
											className={cn(
												"ml-auto h-3 w-3",
												selectedCoin?.contractAddress ===
													coin.contractAddress
													? "opacity-100"
													: "opacity-0"
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
