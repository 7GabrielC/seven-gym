export function hoyArgentinaStr(): string {
  const ahora = new Date();
  // Argentina es UTC-3 todo el año (no tiene horario de verano)
  const enArgentina = new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
  return enArgentina.toISOString().slice(0, 10);
}

/** Igual que arriba, pero devuelve un objeto Date (para cálculos de mes, etc.) */
export function hoyArgentina(): Date {
  const ahora = new Date();
  return new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
}