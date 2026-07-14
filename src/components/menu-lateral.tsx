"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ItemMenu = {
    href: string;
    label: string;
    soloDueno?: boolean;
};

const items: ItemMenu[] = [
    { href: "/", label: "Inicio" },
    { href: "/socios", label: "Socios" },
    { href: "/pagos/nuevo", label: "Registrar pago" },
    { href: "/caja", label: "Caja" },
    { href: "/usuarios", label: "Usuarios", soloDueno: true },
];

export function MenuLateral({ rol }: { rol: string }) {
    const pathname = usePathname();
    const esDueno = rol === "dueño";

    const itemsVisibles = items.filter((item) => !item.soloDueno || esDueno);

    return (
        <nav className="w-56 shrink-0 border-r min-h-screen p-4 space-y-1">
        <div className="text-xl font-bold mb-6 px-2">Seven</div>
        {itemsVisibles.map((item) => {
            const activo =
            item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
            <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded text-sm ${
                activo
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
            >
                {item.label}
            </Link>
            );
        })}
        </nav>
    );
}