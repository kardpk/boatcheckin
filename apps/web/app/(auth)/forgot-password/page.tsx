"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AnchorLoader } from "@/components/ui/AnchorLoader";
import { CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const supabase = createClient();

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") +
        "/auth/reset-password",
    });

    // SECURITY: Always show success — never confirm/deny email exists
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-[48px] h-[48px] rounded-full bg-success-bg flex items-center justify-center mx-auto mb-page">
          <CheckCircle size={24} className="text-success-text" />
        </div>
        <h2 className="text-h2 text-dark-text">Check your email</h2>
        <p className="text-body text-grey-text mt-tight">
          If that email is registered, you&apos;ll receive a reset link
          shortly. Check your spam folder if it doesn&apos;t arrive.
        </p>
        <Link
          href="/login"
          className="inline-block mt-section text-label text-navy hover:underline"
        >
          Back to sign in →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-h1 text-dark-text">Reset your password</h1>
      <p className="text-body text-grey-text mt-tight">
        We&apos;ll send a link to your email
      </p>

      <div className="mt-section">
        <label htmlFor="email" className="text-label text-dark-text block mb-micro">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="hello@yourboat.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[44px] px-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          "Send reset link →"
        )}
      </button>

      <p className="text-label text-grey-text text-center mt-page">
        <Link href="/login" className="text-navy hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}
