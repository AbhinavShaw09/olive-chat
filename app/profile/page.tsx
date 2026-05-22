"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, User, Sun, Moon, Monitor } from "lucide-react";

interface UserData {
  id: number;
  email: string;
  name: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/");
          return;
        }
        setUser(data.user);
        setName(data.user.name || "");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto w-full p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="size-8 rounded-lg border border-input flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{user.name || "Unnamed"}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full h-9 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="size-3.5 mr-1" />
                )}
                Save
              </Button>
              {saved && (
                <span className="text-xs text-green-600">Saved!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs transition-colors ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            <Icon className="size-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
