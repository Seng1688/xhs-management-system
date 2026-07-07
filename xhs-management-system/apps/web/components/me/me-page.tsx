"use client"

import { Camera, ExternalLink, UserRound } from "lucide-react"
import * as React from "react"

import {
  useMeProfile,
  useUploadProfileImageMutation,
} from "@/hooks/use-me-profile"
import { Button } from "@workspace/ui/components/button"

const profileDetails = [
  {
    label: "XHS 名",
    value: "熊的下班生活🐻",
  },
  {
    href: "https://xhslink.com/m/1xoqgZBv0LJ",
    label: "XHS 链接",
    value: "https://xhslink.com/m/1xoqgZBv0LJ",
  },
] as const

function MePage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const profileQuery = useMeProfile()
  const uploadMutation = useUploadProfileImageMutation()

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    uploadMutation.mutate(file)
    event.target.value = ""
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Creator CRM</p>
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-normal">
            Me
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Your creator profile details for quick reference.
          </p>
        </div>
      </header>

      <section className="max-w-2xl rounded-lg border border-border bg-background p-5 shadow-sm">
        <div className="flex flex-col items-center gap-4 border-b border-border pb-5">
          <div className="relative">
            {profileQuery.data?.profileImageUrl ? (
              <div
                aria-label="Profile"
                className="size-32 rounded-full border border-border bg-cover bg-center shadow-sm"
                role="img"
                style={{
                  backgroundImage: `url("${profileQuery.data.profileImageUrl}")`,
                }}
              />
            ) : (
              <div className="flex size-32 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground shadow-sm">
                <UserRound className="size-12" aria-hidden="true" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            type="file"
            onChange={onFileChange}
          />
          <Button
            disabled={uploadMutation.isPending}
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera aria-hidden="true" />
            {uploadMutation.isPending ? "Uploading..." : "Upload picture"}
          </Button>

          {uploadMutation.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {uploadMutation.error.message}
            </p>
          ) : null}
        </div>

        <dl className="divide-y divide-border">
          {profileDetails.map((detail) => (
            <div
              key={detail.label}
              className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4"
            >
              <dt className="text-sm font-medium text-muted-foreground">
                {detail.label}
              </dt>
              <dd className="text-sm font-medium">
                {"href" in detail ? (
                  <a
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    href={detail.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {detail.value}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : (
                  detail.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}

export { MePage }
