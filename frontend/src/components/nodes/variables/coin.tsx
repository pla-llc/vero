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
	{
		id: "test",
		name: "Test",
		symbol: "TEST",
		contractAddress: "TEST",
		icon: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
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

	const selectedCoin = defaultCoins.find(
		(coin) => coin.contractAddress === value || coin.id === value
	);

	const filteredCoins = defaultCoins.filter(
		(coin) =>
			coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
			coin.contractAddress
				?.toLowerCase()
				.includes(searchTerm.toLowerCase())
	);

	const handleSelect = (coin: Coin) => {
		onValueChange?.(coin.contractAddress!);
		setOpen(false);
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
						placeholder="Search coins by contact address..."
						value={searchTerm}
						onValueChange={setSearchTerm}
						className="h-7 text-xs"
					/>
					<CommandList className="max-h-[160px]">
						<CommandEmpty className="py-3 text-xs">
							No coins found.
						</CommandEmpty>
						<CommandGroup heading="Coins">
							{filteredCoins.map((coin) => (
								<CommandItem
									key={coin.id}
									value={coin.id}
									onSelect={() => handleSelect(coin)}
									className="flex items-center gap-1.5 px-1.5 py-1"
								>
									<img
										src={coin.icon}
										className="h-4 w-4 flex-shrink-0 rounded-full"
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
												{coin.contractAddress.slice(-3)}
											</span>
										)}
									</div>
									<CheckIcon
										className={cn(
											"ml-auto h-3 w-3",
											selectedCoin?.id === coin.id
												? "opacity-100"
												: "opacity-0"
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
