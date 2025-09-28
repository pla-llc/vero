"use client";

import { Node, NodeProps } from "@xyflow/react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import BasicNode from "./basic-node";

export default function ScheduleNode(props: NodeProps<Node<{}>>) {
	const [date, setDate] = useState<Date | undefined>(undefined);
	const [time, setTime] = useState<string>("00:00");

	return (
		<BasicNode id="schedule-trigger">
			<div className="flex w-full flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="font-medium">Scheduled Trigger</span>
				</div>
				<div className="grid grid-cols-[1fr_auto] items-center gap-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								data-empty={!date}
								className="data-[empty=true]:text-muted-foreground justify-start text-left font-normal"
							>
								<CalendarIcon />
								{date ? (
									format(date, "PPP")
								) : (
									<span>Pick a date</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0">
							<Calendar
								mode="single"
								selected={date}
								onSelect={setDate}
								modifiers={{
									disabled: (date) => {
										return date < new Date();
									},
								}}
								modifiersClassNames={{
									disabled: "opacity-50",
								}}
							/>
						</PopoverContent>
					</Popover>
					<div className="flex flex-col gap-2">
						<Input
							placeholder="00:00"
							className="fill-white stroke-white text-white"
							type="time"
							value={time}
							onChange={(e) => setTime(e.target.value)}
						/>
					</div>
				</div>
			</div>
		</BasicNode>
	);
}
