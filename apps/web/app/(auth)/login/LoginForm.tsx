"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import Link from "next/link";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { loginAction } from "./actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = loginSchema.safeParse(raw);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        const nextPath = searchParams.get('next');
        const safePath =
          nextPath && nextPath.startsWith('/dashboard')
            ? nextPath
            : '/dashboard';
        router.push(safePath);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Kicker — mono brass rule */}
      <div className="flex items-center" style={{ gap: 'var(--s-3)', marginBottom: 'var(--s-3)' }}>
        <span style={{ width: 24, height: 1, background: 'var(--color-brass)', display: 'block', flexShrink: 0 }} />
        <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-brass)', fontWeight: 600 }}>
          Operator sign in
        </span>
      </div>

      {/* Heading — Fraunces display §4.1 */}
      <h1
        className="font-display"
        style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.025em', color: 'var(--color-bone)', marginBottom: 'var(--s-2)' }}
      >
        Welcome back.
      </h1>
      <p style={{ fontSize: 'var(--t-body-md)', color: 'rgba(244,239,230,0.55)', marginBottom: 'var(--s-8)', lineHeight: 1.6 }}>
        Sign in to manage your fleet, trips &amp; compliance
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
        {/* Email */}
        <div className="field">
          <label htmlFor="email" className="field-label" style={{ color: 'rgba(244,239,230,0.55)' }}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hello@yourboat.com"
            className="field-input"
            style={{ background: 'rgba(244,239,230,0.06)', borderColor: 'rgba(244,239,230,0.18)', color: 'var(--color-bone)' }}
          />
        </div>

        {/* Password */}
        <div className="field">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--s-2)' }}>
            <label htmlFor="password" className="field-label" style={{ color: 'rgba(244,239,230,0.55)', marginBottom: 0 }}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="mono"
              style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-brass)', textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.05em' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter your password"
              className="field-input pr-12"
              style={{ background: 'rgba(244,239,230,0.06)', borderColor: 'rgba(244,239,230,0.18)', color: 'var(--color-bone)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(244,239,230,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert--err" style={{ marginTop: 'var(--s-4)' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn--rust w-full"
        style={{ height: 52, marginTop: 'var(--s-8)', justifyContent: 'center', fontSize: 'var(--t-body-sm)', letterSpacing: '0.04em' }}
      >
        {loading ? <AnchorLoader size="sm" color="white" /> : "Sign in"}
      </button>

      {/* Divider */}
      <div className="flex items-center" style={{ gap: 'var(--s-4)', margin: 'var(--s-6) 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(244,239,230,0.07)' }} />
        <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.35)', letterSpacing: '0.1em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(244,239,230,0.07)' }} />
      </div>

      {/* Footer link */}
      <p style={{ fontSize: 'var(--t-body-sm)', color: 'rgba(244,239,230,0.55)', textAlign: 'center' }}>
        New to BoatCheckin?{" "}
        <Link
          href="/signup"
          className="editorial-link"
          style={{ color: 'var(--color-brass)', borderColor: 'var(--color-brass)', display: 'inline-flex' }}
        >
          Start free trial
        </Link>
      </p>

      {/* Trust badges — mono muted text */}
      <div className="flex items-center justify-center" style={{ gap: 'var(--s-3)', marginTop: 'var(--s-6)', flexWrap: 'wrap' }}>
        {["No credit card", "14-day trial", "Cancel anytime"].map((t) => (
          <span key={t} className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.3)', letterSpacing: '0.06em' }}>
            {t}
          </span>
        ))}
      </div>
    </form>
  );
}
