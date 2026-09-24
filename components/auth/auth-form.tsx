"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AuthState } from "@/lib/actions/auth";
import {
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  updatePassword,
} from "@/lib/actions/auth";

function Feedback({ state, initialError }: { state: AuthState; initialError?: string }) {
  const error = state?.error ?? initialError;
  if (state?.message) {
    return (
      <Alert className="border-success/40 bg-success/10 text-success-foreground [&_svg]:text-success">
        <CheckCircle2Icon />
        <AlertDescription className="text-foreground">{state.message}</AlertDescription>
      </Alert>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  return null;
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signInWithPassword, undefined);
  return (
    <div className="qn-glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your family&apos;s nest.</p>
      </div>
      <form action={action} className="space-y-4">
        <Feedback state={state} initialError={initialError} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <SubmitButton size="lg" className="w-full" pendingText="Signing in...">
          Sign in
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create your nest
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUpWithPassword, undefined);
  return (
    <div className="qn-glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold">Create your nest</h1>
        <p className="text-muted-foreground">Free for families. Takes about two minutes.</p>
      </div>
      <form action={action} className="space-y-4">
        <Feedback state={state} />
        {!state?.message ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" autoComplete="name" placeholder="Alex" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <SubmitButton size="lg" className="w-full" pendingText="Creating...">
              Create account
            </SubmitButton>
          </>
        ) : null}
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, undefined);
  return (
    <div className="qn-glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold">Reset your password</h1>
        <p className="text-muted-foreground">We&apos;ll email you a link to choose a new one.</p>
      </div>
      <form action={action} className="space-y-4">
        <Feedback state={state} initialError={initialError} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <SubmitButton size="lg" className="w-full" pendingText="Sending...">
          Send reset link
        </SubmitButton>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(updatePassword, undefined);
  return (
    <div className="qn-glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold">Choose a new password</h1>
        <p className="text-muted-foreground">Make it something the kids won&apos;t guess.</p>
      </div>
      <form action={action} className="space-y-4">
        <Feedback state={state} />
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <SubmitButton size="lg" className="w-full" pendingText="Saving...">
          Save password
        </SubmitButton>
      </form>
    </div>
  );
}
