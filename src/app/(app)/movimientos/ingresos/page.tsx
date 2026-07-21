import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import {
  pagos,
  suscripciones,
  socios,
  planes,
  otrosIngresos,
  user,
} from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { FormOtroIngreso } from "./form-otro-ingreso";
import { TablaMovimientos, type FilaMovimiento } from "../tabla-movimientos";
import Link from "next/link";
import { hoyArgentina } from "@/lib/fecha-actual";

function pesos(centavos: number, decimales = 0): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: decimales,
  });
}

export default async function IngresosPage() {
  await requerirSesion();

  const hoy = hoyArgentina();
  const primerDiaMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  const [cuotas, otros] = await Promise.all([
    db
      .select({
        id: pagos.id,
        fecha: pagos.fechaPago,
        monto: pagos.montoCentavos,
        metodo: pagos.metodo,
        socioId: socios.id,
        nombre: socios.nombre,
        apellido: socios.apellido,
        plan: planes.nombre,
        usuario: user.name,
        creadoEn: pagos.creadoEn,
      })
      .from(pagos)
      .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
      .innerJoin(socios, eq(suscripciones.socioId, socios.id))
      .innerJoin(planes, eq(suscripciones.planId, planes.id))
      .innerJoin(user, eq(pagos.registradoPor, user.id))
      .where(and(eq(pagos.anulado, false), gte(pagos.fechaPago, primerDiaMes)))
      .orderBy(desc(pagos.fechaPago), desc(pagos.id)),

    db
      .select({
        id: otrosIngresos.id,
        fecha: otrosIngresos.fecha,
        monto: otrosIngresos.montoCentavos,
        metodo: otrosIngresos.metodo,
        descripcion: otrosIngresos.descripcion,
        usuario: user.name,
        creadoEn: otrosIngresos.creadoEn,
      })
      .from(otrosIngresos)
      .innerJoin(user, eq(otrosIngresos.registradoPor, user.id))
      .where(
        and(
          isNull(otrosIngresos.eliminadoEn),
          gte(otrosIngresos.fecha, primerDiaMes),
        ),
      )
      .orderBy(desc(otrosIngresos.fecha), desc(otrosIngresos.id)),
  ]);

  const filas: FilaMovimiento[] = [
    ...cuotas.map((c) => ({
      id: `cuota-${c.id}`,
      fecha: c.fecha,
      concepto: `${c.nombre} ${c.apellido}`,
      detalle: c.plan,
      socioId: c.socioId,
      metodo: c.metodo,
      monto: c.monto,
      usuario: c.usuario,
      creadoEn: c.creadoEn,
    })),
    ...otros.map((o) => ({
      id: `otro-${o.id}`,
      fecha: o.fecha,
      concepto: o.descripcion,
      detalle: "otro ingreso",
      socioId: null,
      metodo: o.metodo,
      monto: o.monto,
      usuario: o.usuario,
      creadoEn: o.creadoEn,
    })),
  ].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
  );

  const total = filas.reduce((t, f) => t + f.monto, 0);
  const totalEfectivo = filas
    .filter((f) => f.metodo === "efectivo")
    .reduce((t, f) => t + f.monto, 0);
  const totalTransferencia = total - totalEfectivo;
  const totalCuotas = cuotas.reduce((t, c) => t + c.monto, 0);
  const totalOtros = total - totalCuotas;

  return (
    <div className="max-w-6xl px-8 py-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingresos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Mes en curso</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          <span className="rounded px-3 py-1 text-sm bg-surface-2 font-medium">
            Ingresos
          </span>
          <Link
            href="/movimientos/egresos"
            className="rounded px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Egresos
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            TOTAL
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular text-success">
            {pesos(total)}
          </div>
          <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
            {filas.length} movimientos
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            EFECTIVO
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular">
            {pesos(totalEfectivo)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            TRANSFERENCIA
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular">
            {pesos(totalTransferencia)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-2">
            CUOTAS / OTROS
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Cuotas</span>
            <span className="text-sm font-semibold tabular">
              {pesos(totalCuotas)}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs text-muted-foreground">Otros</span>
            <span className="text-sm font-semibold tabular">
              {pesos(totalOtros)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TablaMovimientos filas={filas} color="success" />
        </div>

        <div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium mb-1">Otro ingreso</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Para lo que no es cuota: venta de agua, alquiler de locker, etc.
            </p>
            <FormOtroIngreso />
          </div>
        </div>
      </div>
    </div>
  );
}
