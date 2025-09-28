"use client";

import { createClientApi } from "@/lib/hono/client";
import { Node, NodeProps } from "@xyflow/react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import BasicNode from "./basic-node";

export default function ScheduleNode(props: NodeProps<Node<{}>>) {
	const [date, setDate] = useState<Date | undefined>(undefined);
	const [time, setTime] = useState<string>("00:00");

	const [convertedDate, setConvertedDate] = useState<string | undefined>(
		undefined
	);

	useEffect(() => {
		if (!date || !time) return;

		const utcDate = new Date(
			date.getTime() + date.getTimezoneOffset() * 60000
		);
		const month = utcDate.getMonth();
		const day = utcDate.getDate();
		const year = utcDate.getFullYear();
		const [hour, minute] = time.split(":");

		const newDate = new Date();
		newDate.setMonth(month);
		newDate.setDate(day);
		newDate.setHours(parseInt(hour));
		newDate.setMinutes(parseInt(minute));
		newDate.setSeconds(0);
		setConvertedDate(newDate.toISOString());
	}, [date, time]);

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
										return (
											date.getDate() <
											new Date().getDate()
										);
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
						<button
							onClick={async () => {
								if (!convertedDate) return;

								const api = createClientApi();
								const res = await api.tracking.schedule.$post({
									json: {
										date: convertedDate,
									},
								});
								const data = await res.json();
								console.log(JSON.stringify(data, null, 2));
							}}
						>
							add schedule
						</button>
					</div>
				</div>
			</div>
		</BasicNode>
	);
}
