"use client"

import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { authSessionQueryKey } from "@/hooks/use-auth-session"
import { useMeProfile } from "@/hooks/use-me-profile"
import { logout as logoutUser } from "@/lib/auth"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/invitations",
    icon: Store,
    label: "Invitations",
  },
  {
    href: "/calendar",
    icon: CalendarDays,
    label: "Calendar",
  },
  {
    href: "/joiners",
    icon: UsersRound,
    label: "Joiners",
  },
  {
    href: "/content",
    icon: FileText,
    label: "Content",
  },
] as const

type SidebarNavProps = {
  isCollapsed: boolean
  onCollapsedChange: (isCollapsed: boolean) => void
}

function SidebarNav({ isCollapsed, onCollapsedChange }: SidebarNavProps) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const router = useRouter()

  async function logout() {
    try {
      await logoutUser()
    } finally {
      queryClient.removeQueries({ queryKey: authSessionQueryKey })
      router.push("/login")
    }
  }

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen min-h-0 border-r border-border bg-background transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:flex-col",
          isCollapsed ? "w-[84px]" : "w-[260px]"
        )}
      >
        <SidebarBrand
          isCollapsed={isCollapsed}
          onToggle={() => onCollapsedChange(!isCollapsed)}
        />

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-0",
                  isActive && "bg-muted text-foreground"
                )}
                href={item.href}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className={cn(isCollapsed && "sr-only")}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          </div>
        </nav>

        <SidebarAccount
          isActive={pathname === "/me"}
          isCollapsed={isCollapsed}
          onLogout={logout}
        />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" aria-hidden="true" />
          </span>
          <span className="font-heading text-sm font-semibold">XHS CRM</span>
        </div>
        <Button aria-label="Logout" size="icon-sm" variant="outline" onClick={logout}>
          <LogOut aria-hidden="true" />
        </Button>
      </header>
    </>
  )
}

function SidebarBrand({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean
  onToggle: () => void
}) {
  return (
    <div className="shrink-0 border-b border-border px-3 py-4">
      <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutDashboard className="size-5" aria-hidden="true" />
        </span>
        {!isCollapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-base font-semibold">XHS CRM</p>
            <p className="truncate text-xs text-muted-foreground">
              Creator workspace
            </p>
          </div>
        ) : null}
        <Button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <ChevronsRight aria-hidden="true" />
          ) : (
            <ChevronsLeft aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  )
}

function SidebarAccount({
  isActive,
  isCollapsed,
  onLogout,
}: {
  isActive: boolean
  isCollapsed: boolean
  onLogout: () => void
}) {
  const profileQuery = useMeProfile()
  const profileImageUrl = profileQuery.data?.profileImageUrl

  return (
    <div className="shrink-0 border-t border-border p-3">
      <Link
        href="/me"
        title={isCollapsed ? "Me" : undefined}
        className={cn(
          "mb-3 flex items-center gap-3 rounded-md bg-muted/70 p-3 text-left transition-colors hover:bg-muted hover:text-foreground",
          isCollapsed && "justify-center px-2",
          isActive && "bg-muted text-foreground"
        )}
      >
        {profileImageUrl ? (
          <span
            aria-label="Profile"
            className="inline-flex size-9 items-center justify-center rounded-full bg-cover bg-center ring-1 ring-border"
            role="img"
            style={{ backgroundImage: `url("${profileImageUrl}")` }}
          />
        ) : (
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
        )}
        {!isCollapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">熊的下班生活🐻</p>
            <p className="truncate text-xs text-muted-foreground">Signed in</p>
          </div>
        ) : null}
      </Link>
      <Button
        aria-label="Logout"
        className={cn("w-full", isCollapsed ? "px-0" : "justify-start")}
        size={isCollapsed ? "icon" : "default"}
        variant="outline"
        onClick={onLogout}
      >
        <LogOut aria-hidden="true" />
        {!isCollapsed ? "Logout" : null}
      </Button>
    </div>
  )
}

export { SidebarNav }
