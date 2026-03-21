"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getNextUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("next") || "/dashboard";
  };

  const signInWithGoogle = async () => {
    setErrorMessage(null);
    setLoadingGoogle(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextUrl())}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoadingGoogle(false);
    }
  };

  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") {
      setIsSignUp(true);
    }
  }, []);

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoadingEmail(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextUrl())}` },
      });
      setLoadingEmail(false);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage(null);
      setIsSignUp(false);
      // Show confirmation message
      setConfirmationSent(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoadingEmail(false);

    if (error) {
      setErrorMessage("Email or password is incorrect. Try again or sign up below.");
      return;
    }

    router.replace(getNextUrl());
  };

  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Branded header strip */}
      <div className="bg-brand-700 px-4 py-8 sm:py-12 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Logo size={36} />
          <span className="text-lg font-bold text-white tracking-tight">CareLadder</span>
        </Link>
        <p className="mt-2 text-sm text-brand-200">Texas childcare funding, simplified.</p>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-6 pb-12">
        <div className="bg-white border border-warm-200/80 rounded-2xl p-6 sm:p-8 shadow-lg">
          {confirmationSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h1 className="text-xl font-extrabold text-warm-900 mb-2">Check your email</h1>
              <p className="text-sm text-warm-500 mb-4">
                We sent a confirmation link to <span className="font-semibold text-warm-700">{email}</span>.
                Click the link to activate your account.
              </p>
              <button
                onClick={() => { setConfirmationSent(false); setIsSignUp(false); }}
                className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition"
              >
                Back to login
              </button>
            </div>
          ) : (
          <>
          <h1 className="text-2xl font-extrabold text-warm-900 tracking-tight">
            {isSignUp ? "Create your account" : "Log in to your account"}
          </h1>
          <p className="text-sm text-warm-500 mt-2 mb-6">
            {isSignUp
              ? "Create your free account to access your roadmap."
              : "See your TRS certification roadmap and start earning more."}
          </p>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loadingGoogle || loadingEmail}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-semibold text-warm-800 hover:border-warm-300 hover:bg-warm-50 transition disabled:opacity-60 shadow-sm"
          >
            {loadingGoogle ? (
              "Connecting to Google..."
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-warm-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-warm-400">or</span>
            <div className="h-px flex-1 bg-warm-200" />
          </div>

          <form onSubmit={signInWithEmail} className="space-y-3.5">
            <div>
              <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="director@yourcenter.com"
                className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-warm-500 mb-1.5 font-semibold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full bg-warm-50 border border-warm-200 rounded-xl px-4 py-3 text-warm-800 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
              />
              {!isSignUp && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!email.trim()) { setErrorMessage("Enter your email first."); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(email);
                    if (error) { setErrorMessage(error.message); }
                    else { setErrorMessage(null); setResetSent(true); }
                  }}
                  className="text-xs text-brand-600 hover:text-brand-700 mt-1 py-1"
                >
                  Forgot password?
                </button>
              )}
              {resetSent && (
                <p className="mt-1 text-xs text-emerald-700">Check your email for a password reset link.</p>
              )}
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loadingGoogle || loadingEmail}
              className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60"
            >
              {loadingEmail
                ? (isSignUp ? "Creating account..." : "Signing in...")
                : (isSignUp ? "Create account" : "Continue with email")}
            </button>
          </form>

          <p className="text-center text-xs text-warm-400 mt-5">
            {isSignUp ? (
              <>Already have an account?{" "}
                <button onClick={() => { setIsSignUp(false); setErrorMessage(null); }} className="text-brand-600 font-semibold hover:text-brand-700 py-1 px-1">
                  Log in
                </button>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => { setIsSignUp(true); setErrorMessage(null); }} className="text-brand-600 font-semibold hover:text-brand-700 py-1 px-1">
                  Sign up
                </button>
              </>
            )}
          </p>
          <div className="text-center mt-4">
            <a href="/pricing" className="text-sm text-warm-500 hover:text-warm-700 py-2 inline-block transition">See pricing →</a>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
