"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Dumbbell, MailCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Set once signUp() succeeds but Supabase hasn't returned a session yet,
  // which means "Confirm email" is on and the account is pending
  // confirmation. Swaps the form out for a "check your email" card.
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (!data.session) {
      // Email confirmation is required before a session is issued. Don't
      // redirect into the app (middleware would just bounce back to
      // /login with no explanation) — show a "check your email" state.
      setPendingConfirmationEmail(email)
      return
    }

    router.push("/")
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setError(null)
    setIsGoogleLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  async function handleResend() {
    if (!pendingConfirmationEmail) return

    setIsResending(true)
    setResendSuccess(false)
    setResendError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingConfirmationEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsResending(false)

    if (error) {
      setResendError(error.message)
      return
    }

    setResendSuccess(true)
    setTimeout(() => setResendSuccess(false), 5000)
  }

  if (pendingConfirmationEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <MailCheck className="mb-2 h-8 w-8" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <span className="font-medium text-foreground">{pendingConfirmationEmail}</span>.
              Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resendError && <p className="text-sm text-destructive">{resendError}</p>}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending || resendSuccess}
            >
              {isResending ? "Sending..." : resendSuccess ? "Sent!" : "Resend email"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Wrong email?{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setPendingConfirmationEmail(null)
                  setResendError(null)
                  setResendSuccess(false)
                }}
              >
                Go back
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Dumbbell className="mb-2 h-8 w-8" />
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start tracking your fitness journey with Sculpt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
