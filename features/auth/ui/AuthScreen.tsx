"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UserData } from "@/lib/chat";
import { authenticateAction } from "@/features/auth/lib/actions";
import { AUTH_MODE } from "@/features/auth/lib/types";
import type { AuthMode } from "@/features/auth/lib/types";

export function AuthScreen({
  onAuth,
}: {
  onAuth: (user: UserData) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(AUTH_MODE.LOGIN);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authenticateAction(mode, email, password, name);
      onAuth(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Olive Chat</h1>
          <p className="text-sm text-muted-foreground">
            {mode === AUTH_MODE.LOGIN ? "Sign in to your account" : "Create an account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          />
          {mode === AUTH_MODE.SIGNUP && (
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {mode === AUTH_MODE.LOGIN ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === AUTH_MODE.LOGIN ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode(AUTH_MODE.SIGNUP);
                  setError("");
                }}
                className="underline hover:text-foreground"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode(AUTH_MODE.LOGIN);
                  setError("");
                }}
                className="underline hover:text-foreground"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
