"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function manejarLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setCargando(true);

        const { error } = await authClient.signIn.email({
        email,
        password,
        });

        if (error) {
        setError("Email o contraseña incorrectos.");
        setCargando(false);
        } else {
        router.push("/");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm p-8">
            <h1 className="text-2xl font-bold mb-2 text-center">Seven</h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
            Iniciá sesión para continuar
            </p>

            <form onSubmit={manejarLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={cargando}>
                {cargando ? "Ingresando..." : "Iniciar sesión"}
            </Button>
            </form>
        </div>
        </div>
    );
}