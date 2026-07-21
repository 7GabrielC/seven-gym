import { hoyArgentina } from "@/lib/fecha-actual";

export type Periodo = {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  etiqueta: string;
};

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function aStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Período de un mes completo. mes: 0-11 */
export function periodoMes(anio: number, mes: number): Periodo {
  const primero = new Date(Date.UTC(anio, mes, 1));
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0));
  return {
    desde: aStr(primero),
    hasta: aStr(ultimo),
    etiqueta: `${MESES[mes]} ${anio}`,
  };
}

/** Período libre entre dos fechas */
export function periodoRango(desde: string, hasta: string): Periodo {
  return { desde, hasta, etiqueta: `${desde} a ${hasta}` };
}


/** El mes actual */
export function periodoMesActual(): Periodo {
  const hoy = hoyArgentina();
  return periodoMes(hoy.getUTCFullYear(), hoy.getUTCMonth());
}

/** El período inmediatamente anterior, del mismo largo */
export function periodoAnterior(p: Periodo): Periodo {
  const desde = new Date(p.desde + "T00:00:00Z");
  const hasta = new Date(p.hasta + "T00:00:00Z");
  const dias = Math.round((hasta.getTime() - desde.getTime()) / 86400000) + 1;

  const nuevoHasta = new Date(desde.getTime() - 86400000);
  const nuevoDesde = new Date(nuevoHasta.getTime() - (dias - 1) * 86400000);

  return {
    desde: aStr(nuevoDesde),
    hasta: aStr(nuevoHasta),
    etiqueta: "Período anterior",
  };
}

/** Lista de meses disponibles para el selector, desde una fecha hasta hoy */
export function mesesDisponibles(desdeAnio: number, desdeMes: number) {
  const lista: { valor: string; etiqueta: string }[] = [];
  const hoy = hoyArgentina();
  let anio = hoy.getUTCFullYear();
  let mes = hoy.getUTCMonth();

  while (anio > desdeAnio || (anio === desdeAnio && mes >= desdeMes)) {
    lista.push({
      valor: `${anio}-${String(mes + 1).padStart(2, "0")}`,
      etiqueta: `${MESES[mes]} ${anio}`,
    });
    mes--;
    if (mes < 0) {
      mes = 11;
      anio--;
    }
  }
  return lista;
}
