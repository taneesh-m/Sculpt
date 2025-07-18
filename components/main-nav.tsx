"use client"

import Link from "next/link"
import { Dumbbell } from "lucide-react"

export function MainNav() {
  return (
    <div className="flex h-16 items-center px-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <Dumbbell className="h-6 w-6" />
        <span>Sculpt</span>
      </Link>
    </div>
  )
}
