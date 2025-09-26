import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  modifiers?: Record<string, (date: Date) => boolean>;
  modifiersClassNames?: Record<string, string>;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled,
  className,
  modifiers,
  modifiersClassNames
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={disabled}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames || {
            validRange: "bg-primary/10 border-primary/20 border-2 rounded-md"
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}