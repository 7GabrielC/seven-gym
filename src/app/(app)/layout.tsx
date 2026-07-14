import { requerirSesion } from "@/lib/session";
import { MenuLateral } from "@/components/menu-lateral";
import { BarraUsuario } from "@/components/barra-usuario";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requerirSesion();

    return (
        <div className="flex min-h-screen">
        <MenuLateral rol={session.user.rol ?? "recepcionista"} />
        <div className="flex-1">
            <div className="flex justify-end p-4 border-b">
            <BarraUsuario
                nombre={session.user.name}
                rol={session.user.rol ?? "recepcionista"}
            />
            </div>
            <main>{children}</main>
        </div>
        </div>
    );
}