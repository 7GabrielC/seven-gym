export async function medir<T>(nombre: string, fn: () => Promise<T>): Promise<T> {
    const inicio = performance.now();
    const resultado = await fn();
    const ms = Math.round(performance.now() - inicio);
    console.log(`⏱  ${nombre}: ${ms}ms`);
    return resultado;
}