import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Officer Sign In — Nirikshan Inspection Platform" },
      {
        name: "description",
        content:
          "Secure sign in for field officers and administrators of the Nirikshan smart inspection and attendance verification platform.",
      },
      { property: "og:title", content: "Officer Sign In — Nirikshan" },
      {
        property: "og:description",
        content: "Secure access to Nirikshan attendance and activity verification.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. You can sign in now.");
  }

  return (
    <div className="gradient-gov flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card-surface w-full max-w-md p-6"
      >
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-lg">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold">Nirikshan</h1>
            <p className="text-muted-foreground text-xs">Smart Inspection Platform</p>
          </div>
        </div>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Create account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 pt-4">
            <Field label="Official email" value={email} onChange={setEmail} type="email" />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
            />
            <Button className="w-full" onClick={signIn} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 pt-4">
            <Field label="Full name" value={fullName} onChange={setFullName} />
            <Field label="Official email" value={email} onChange={setEmail} type="email" />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
            />
            <Button className="w-full" onClick={signUp} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Create account
            </Button>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
