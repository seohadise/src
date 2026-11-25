"use client";

import { useState } from "react";
import { Calendar } from "./calendar";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { CalendarIcon } from "lucide-react";
import { formatDateInPersian } from "@/lib/date";
import { cn } from "@/lib/utils";

const PersianDatePicker = ({ value, onChange, placeholder = "انتخاب تاریخ", className, defaultMonth }) => {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;
  const initialMonth = defaultMonth ? new Date(defaultMonth) : (selectedDate || new Date());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-right font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {value ? formatDateInPersian("single", selectedDate) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
              setOpen(false);
            }
          }}
          defaultMonth={initialMonth}
          disabled={[{ before: new Date(new Date().setHours(0, 0, 0, 0)) }]}
          startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
          endMonth={new Date(new Date().getFullYear() + 2, 11, 31)}
        />
      </PopoverContent>
    </Popover>
  );
};

export { PersianDatePicker };
