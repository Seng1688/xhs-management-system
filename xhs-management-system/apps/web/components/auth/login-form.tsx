"use client"

import { LoaderCircle, LockKeyhole, User } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import { authSessionQueryKey } from "@/hooks/use-auth-session"
import { useLoginMutation } from "@/hooks/use-login-mutation"
import { Button } from "@workspace/ui/components/button"

function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const loginMutation = useLoginMutation()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    loginMutation.mutate(
      {
        password,
        username,
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
          router.push("/dashboard")
        },
      }
    )
  }

  return (
    <form className="flex flex-col gap-6 p-6 md:p-8" onSubmit={onSubmit}>
      <div className="space-y-2">
        <h2 className="font-heading text-xl font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Enter your username and password to continue.
        </p>
      </div>

      <div className="space-y-4">
        <label className="grid gap-2 text-sm font-medium" htmlFor="username">
          Username
          <span className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="username"
              name="username"
              autoComplete="username"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="admin"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium" htmlFor="password">
          Password
          <span className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Enter your password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </span>
        </label>
      </div>

      {loginMutation.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loginMutation.error.message}
        </p>
      ) : null}

      {loginMutation.isSuccess ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          Signed in successfully.
        </p>
      ) : null}

      <Button
        className="w-full"
        disabled={loginMutation.isPending}
        size="lg"
        type="submit"
      >
        {loginMutation.isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : null}
        Sign in
      </Button>
    </form>
  )
}

export { LoginForm }
