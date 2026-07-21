"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (searchParams.get("desactivado") === "1") {
      setError("Tu cuenta fue desactivada. Contactá al dueño del gimnasio.");
    }
  }, [searchParams]);

  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const { data, error } = await authClient.signIn.email({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    // Better Auth ya autenticó; verificamos si la cuenta sigue activa.
    if (data?.user && (data.user as { activo?: boolean }).activo === false) {
      await authClient.signOut();
      setError("Esta cuenta fue desactivada. Contactá al dueño del gimnasio.");
      setCargando(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Resplandor de fondo, sutil */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-140 rounded-full opacity-[0.15] blur-3xl"
        style={{ background: "var(--primary)" }}
      />

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/sevenLogoBlanco.png"
            alt="Seven"
            width={72}
            height={72}
            className="hidden dark:block"
            priority
          />
          <Image
            src="/images/sevenLogoNegro.png"
            alt="Seven"
            width={72}
            height={72}
            className="block dark:hidden"
            priority
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-7 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold tracking-tight">
              Iniciar sesión
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresá para gestionar tu gimnasio
            </p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-5">
          Sistema de gestión Seven
        </p>
      </div>
    </div>
  );
}
