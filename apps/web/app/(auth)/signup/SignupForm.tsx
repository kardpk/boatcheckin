"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import Link from "next/link";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { signupAction } from "./actions";

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  companyName: z.string().max(100).optional(),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof signupSchema>, string>>;

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  function validateField(name: string, value: string) {
    const partial = { [name]: value };
    const result = signupSchema.partial().safeParse(partial);
    if (!result.success) {
      const fieldError = result.error.issues.find(
        (i) => i.path[0] === name
      );
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [name]: fieldError.message }));
      }
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FieldErrors];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");

    const formData = new FormData(e.currentTarget);
    const raw = {
      fullName: formData.get("fullName") as string,
      companyName: (formData.get("companyName") as string) || undefined,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Client validation
    const result = signupSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await signupAction(formData);
      if (res?.error) {
        if (res.field) {
          setErrors({ [res.field]: res.error });
        } else {
          setServerError(res.error);
        }
      } else {
        router.push("/dashboard/boats/new");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClasses = `field-input`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Kicker — mono brass rule */}
      <div className="flex items-center" style={{ gap: 'var(--s-3)', marginBottom: 'var(--s-3)' }}>
        <span style={{ width: 24, height: 1, background: 'var(--color-brass)', display: 'block', flexShrink: 0 }} />
        <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-brass)', fontWeight: 600 }}>
          14-day free trial
        </span>
      </div>

      {/* Heading — Fraunces display §4.1 */}
      <h1
        className="font-display"
        style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.025em', color: 'var(--color-bone)', marginBottom: 'var(--s-2)' }}
      >
        Start your <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--color-rust-soft)' }}>free trial.</em>
      </h1>
      <p style={{ fontSize: 'var(--t-body-md)', color: 'rgba(244,239,230,0.55)', marginBottom: 'var(--s-8)', lineHeight: 1.6 }}>
        Set up your first vessel in 15 minutes. No credit card.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
        {/* Full name */}
        <div className={`field${errors.fullName ? ' field--error' : ''}`}>
          <label htmlFor="fullName" className="field-label" style={{ color: 'rgba(244,239,230,0.55)' }}>Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Captain Conrad Rivera"
            onBlur={(e) => validateField("fullName", e.target.value)}
            className={inputClasses}
            style={{ background: 'rgba(244,239,230,0.06)', borderColor: errors.fullName ? 'var(--color-status-err)' : 'rgba(244,239,230,0.18)', color: 'var(--color-bone)' }}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

        {/* Company name */}
        <div className="field">
          <label htmlFor="companyName" className="field-label" style={{ color: 'rgba(244,239,230,0.55)' }}>
            Company or boat name
            <span className="mono" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 'var(--s-2)', color: 'rgba(244,239,230,0.35)' }}>optional</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="Conrad Charter Co."
            className={inputClasses}
            style={{ background: 'rgba(244,239,230,0.06)', borderColor: 'rgba(244,239,230,0.18)', color: 'var(--color-bone)' }}
          />
        </div>

        {/* Email */}
        <div className={`field${errors.email ? ' field--error' : ''}`}>
          <label htmlFor="email" className="field-label" style={{ color: 'rgba(244,239,230,0.55)' }}>Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hello@yourboat.com"
            onBlur={(e) => validateField("email", e.target.value)}
            className={inputClasses}
            style={{ background: 'rgba(244,239,230,0.06)', borderColor: errors.email ? 'var(--color-status-err)' : 'rgba(244,239,230,0.18)', color: 'var(--color-bone)' }}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className={`field${errors.password ? ' field--error' : ''}`}>
          <label htmlFor="password" className="field-label" style={{ color: 'rgba(244,239,230,0.55)' }}>Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Min 8 characters"
              onBlur={(e) => validateField("password", e.target.value)}
              className={`${inputClasses} pr-12`}
              style={{ background: 'rgba(244,239,230,0.06)', borderColor: errors.password ? 'var(--color-status-err)' : 'rgba(244,239,230,0.18)', color: 'var(--color-bone)' }}
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
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="alert alert--err" style={{ marginTop: 'var(--s-4)' }}>
          <span>{serverError}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn--rust w-full"
        style={{ height: 52, marginTop: 'var(--s-8)', justifyContent: 'center', fontSize: 'var(--t-body-sm)', letterSpacing: '0.04em' }}
      >
        {loading ? <AnchorLoader size="sm" color="white" /> : "Create account"}
      </button>

      {/* Divider */}
      <div className="flex items-center" style={{ gap: 'var(--s-4)', margin: 'var(--s-6) 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(244,239,230,0.07)' }} />
        <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.35)', letterSpacing: '0.1em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(244,239,230,0.07)' }} />
      </div>

      {/* Footer link */}
      <p style={{ fontSize: 'var(--t-body-sm)', color: 'rgba(244,239,230,0.55)', textAlign: 'center' }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="editorial-link"
          style={{ color: 'var(--color-brass)', borderColor: 'var(--color-brass)', display: 'inline-flex' }}
        >
          Sign in
        </Link>
      </p>

      {/* Compliance badges — .pill--brass */}
      <div className="flex items-center justify-center" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-6)', flexWrap: 'wrap' }}>
        {["ESIGN Act", "USCG Compliant", "GDPR Ready"].map((badge) => (
          <span key={badge} className="pill pill--brass" style={{ fontSize: 'var(--t-mono-xs)' }}>
            {badge}
          </span>
        ))}
      </div>
    </form>
  );
}
