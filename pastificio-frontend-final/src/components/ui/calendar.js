// src/components/ui/calendar.js
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  locale,
  ...props
}) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ]

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handleDayClick = (day) => {
    if (!day) return
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    onSelect?.(newDate)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["D", "L", "M", "M", "G", "V", "S"].map((day) => (
          <div key={day} className="font-semibold p-2">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const isSelected = selected && day &&
            selected.getDate() === day &&
            selected.getMonth() === currentMonth.getMonth() &&
            selected.getFullYear() === currentMonth.getFullYear()

          return (
            <div key={index} className="p-0">
              {day ? (
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDayClick(day)}
                  className="h-9 w-9 p-0 font-normal"
                  type="button"
                >
                  {day}
                </Button>
              ) : (
                <div className="h-9 w-9" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}