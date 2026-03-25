"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-dark pt-16">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-aubergine mb-2">
            Sultana&apos;s Kitchen
          </h1>
          <p className="text-warm-brown text-sm">Dashboard access</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-cream rounded-2xl shadow-sm border border-warm-brown/10 p-8 space-y-5"
        >
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-sm text-aubergine font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-warm-brown/20 bg-cream-dark text-aubergine text-sm focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm text-aubergine font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-warm-brown/20 bg-cream-dark text-aubergine text-sm focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>

          {error && (
            <p className="text-terracotta text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-aubergine text-cream py-2.5 rounded-xl font-medium hover:bg-aubergine-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
