"use client"

import * as React from "react"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { cn } from "@workspace/ui/lib/utils"

function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)

  return (
    <div
      className={cn(
        "min-h-screen bg-muted/30 lg:grid",
        isSidebarCollapsed ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[260px_1fr]"
      )}
    >
      <SidebarNav
        isCollapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      <div className="min-w-0 lg:pl-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export { AppShell }
