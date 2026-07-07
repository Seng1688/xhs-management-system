"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { useAuthSession } from "@/hooks/use-auth-session"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const sessionQuery = useAuthSession()

  React.useEffect(() => {
    if (sessionQuery.isError) {
      router.replace("/login")
    }
  }, [router, sessionQuery.isError])

  if (sessionQuery.isLoading || sessionQuery.isError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Checking access...
      </main>
    )
  }

  return <>{children}</>
}

export { ProtectedRoute }
