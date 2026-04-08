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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-h1 text-dark-text">Start your free trial</h1>
      <p className="text-body text-grey-text mt-tight">
        14 days free. No credit card.
      </p>

      <div className="mt-section flex flex-col gap-page">
        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="text-label text-dark-text block mb-micro">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Captain Conrad Rivera"
            onBlur={(e) => validateField("fullName", e.target.value)}
            className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
          />
          {errors.fullName && (
            <p className="text-[12px] text-error-text mt-micro">{errors.fullName}</p>
          )}
        </div>

        {/* Company name */}
        <div>
          <label htmlFor="companyName" className="text-label text-dark-text block mb-micro">
            Company or boat name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="Conrad Charter Co. (optional)"
            className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="text-label text-dark-text block mb-micro">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="hello@yourboat.com"
            onBlur={(e) => validateField("email", e.target.value)}
            className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
          />
          {errors.email && (
            <p className="text-[12px] text-error-text mt-micro">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="text-label text-dark-text block mb-micro">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Min 8 characters"
              onBlur={(e) => validateField("password", e.target.value)}
              className="w-full h-[44px] px-standard pr-[44px] border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-text hover:text-dark-text transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[12px] text-error-text mt-micro">{errors.password}</p>
          )}
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mt-page p-standard bg-error-bg rounded-chip">
          <p className="text-[13px] text-error-text">{serverError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          "Create account →"
        )}
      </button>

      {/* Footer link */}
      <p className="text-label text-grey-text text-center mt-page">
        Already have an account?{" "}
        <Link href="/login" className="text-navy hover:underline">
          Sign in →
        </Link>
      </p>
    </form>
  );
}
