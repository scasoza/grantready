"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      if (error.message.toLowerCase().includes("invalid")) {
        // Account doesn't exist — switch to signup mode
        setIsSignUp(true);
        setErrorMessage(null);
        return;
      }
      setErrorMessage(error.message);
      return;
    }

    router.replace(getNextUrl());
  };

  const [confirmationSent, setConfirmationSent] = useState(false);

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/25">
            <span className="text-white font-extrabold text-sm">G</span>
          </div>
          <span className="text-lg font-bold text-warm-900 tracking-tight">GrantReady</span>
        </Link>

        <div className="bg-white border border-warm-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
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
            className="w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm font-semibold text-warm-800 hover:border-warm-300 hover:bg-warm-50 transition disabled:opacity-60"
          >
            {loadingGoogle ? "Connecting to Google..." : "Continue with Google"}
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
            </div>

            {errorMessage && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={loadingGoogle || loadingEmail}
              className="w-full bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-3 rounded-xl font-semibold transition shadow-md shadow-brand-600/20 disabled:opacity-60"
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
          <a href="/pricing" className="text-sm text-warm-400 hover:text-warm-500 mt-4 inline-block py-2">See pricing →</a>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
