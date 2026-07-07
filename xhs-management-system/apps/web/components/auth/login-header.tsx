import { ShieldCheck } from "lucide-react"

function LoginHeader() {
  return (
    <div className="flex min-h-80 flex-col justify-between bg-foreground p-8 text-background md:p-10">
      <div className="inline-flex size-10 items-center justify-center rounded-md bg-background/10">
        <ShieldCheck className="size-5" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-4">
        <p className="text-sm font-medium text-background/70">
          XHS Management System
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-normal md:text-4xl">
          Sign in to your workspace
        </h1>
        <p className="text-sm leading-6 text-background/70">
          Access campaign operations, account activity, and management tools
          from one secure dashboard.
        </p>
      </div>
    </div>
  )
}

export { LoginHeader }
