"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MultiSelectProps = {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  allowOther?: boolean
  // A stable accessible name for the control -- role="combobox" takes its name
  // "from author", so without this the field is unlabeled for screen readers.
  ariaLabel?: string
}

// A dropdown-style multi-select: a trigger showing the chosen values as chips,
// opening a checkbox list of a fixed option set plus an optional "Other"
// free-text field for values outside the list.
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  allowOther = true,
  ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [other, setOther] = useState("")

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const addOther = () => {
    const value = other.trim()
    if (value && !selected.includes(value) && !options.includes(value)) {
      onChange([...selected, value])
    }
    setOther("")
  }

  // Selected values that aren't part of the fixed option set (added via Other).
  const customValues = selected.filter((v) => !options.includes(v))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className="h-auto min-h-10 w-full justify-between font-normal"
        >
          <span className="flex flex-1 flex-wrap gap-1 text-left">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((v) => (
                <Badge key={v} variant="secondary">
                  {v}
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="max-h-60 overflow-y-auto p-1">
          {[...options, ...customValues].map((opt) => {
            const isChecked = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={isChecked}
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary",
                    isChecked ? "bg-primary text-primary-foreground" : "opacity-60",
                  )}
                >
                  {isChecked && <Check className="h-3 w-3" />}
                </span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>
        {allowOther && (
          <div className="flex items-center gap-2 border-t p-2">
            <Input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Other..."
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addOther()
                }
              }}
            />
            <Button type="button" size="sm" variant="secondary" onClick={addOther} aria-label="Add custom option">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
