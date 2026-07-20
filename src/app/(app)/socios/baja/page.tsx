import { requerirDueno } from "@/lib/session";
import { db } from "@/db";
import { socios } from "@/db/schema";
import { isNotNull, desc } from "drizzle-orm";
import Link from "next/link";

export default async function SociosBajaPage() {
  await requerirDueno();

  const dados = await db
    .select()
    .from(socios)
    .where(isNotNull(socios.eliminadoEn))
    .orderBy(desc(socios.eliminadoEn));

  return (
    <div className="max-w-4xl px-8 py-7">
      <Link
        href="/socios"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Socios
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Dados de baja
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Se reactivan automáticamente al intentar crear un socio con el mismo
        DNI.
      </p>

      {dados.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay socios dados de baja.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  SOCIO
                </th>
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  DNI
                </th>
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  DADO DE BAJA
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="py-2.5 px-4 text-sm">
                    {s.nombre} {s.apellido}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-muted-foreground tabular">
                    {s.dni}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-muted-foreground tabular">
                    {s.eliminadoEn &&
                      new Date(s.eliminadoEn).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
