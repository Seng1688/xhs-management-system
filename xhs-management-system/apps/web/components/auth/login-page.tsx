import { LoginForm } from "@/components/auth/login-form"
import { LoginHeader } from "@/components/auth/login-header"

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-cols-[1fr_420px]">
        <LoginHeader />
        <LoginForm />
      </section>
    </main>
  )
}

export { LoginPage }
