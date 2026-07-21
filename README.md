# Seven — Sistema de gestión para gimnasios

Sistema de administración interna para gimnasios: gestión de socios, cobro de cuotas, control de vencimientos, caja por turno y métricas.

**No es una app para socios.** Es una herramienta de mostrador y administración, usada por el dueño y los recepcionistas desde una computadora.

---

## Estado del proyecto

En desarrollo activo. Proyecto de aprendizaje con intención de venta a un gimnasio real.

**Módulos funcionando:**
- Socios: alta, listado con buscador/filtros/paginación, ficha individual, edición, baja (soft delete) con cierre automático de suscripción, reactivación de socios dados de baja (con detección en vivo de DNI), estado derivado (activo / por vencer / vencido / inactivo)
- Pagos: registro con cálculo de vencimiento, precio congelado, encadenamiento de períodos, anulación con auditoría
- Planes y precios: cambio de precio con historial, activar/desactivar planes, creación de planes nuevos (solo dueño)
- Movimientos: vista unificada de Ingresos (cuotas + otros ingresos) y Egresos (gastos con categorías), con buscador, filtro por método, agrupación por día con límites expandibles
- Caja: apertura por turno, cierre con arqueo, ajustes excepcionales, historial filtrado por rol, detalle de cada caja cerrada (movimientos + saldo acumulado, solo lectura)
- Reportes (solo dueño): selector de período (mes o rango libre), resumen financiero con resultado, comparación vs período anterior, desglose por plan y por categoría, métricas de socios (altas/bajas/renovación), gráfico de 6 meses
- Autenticación: login email/password, dos roles (dueño / recepcionista), sesiones, protección de páginas y acciones
- Usuarios: creación de cuentas, desactivación/reactivación (no se borran, se desactivan), protegido contra auto-desactivación y desactivar al último dueño
- Dashboard: saludo según hora del día, listas accionables (por vencer, vencidos), métricas con variación mensual, gráfico de área e historial de socios por plan (donut)
- Diseño: tema claro/oscuro completo, sistema de tokens, animaciones (números que cuentan, gráficos que se dibujan, entrada escalonada de filas, confirmaciones en botones, toasts)

**Pendiente:** observaciones, validación de formato (Zod), mobile, paginación del lado del servidor (solo si el volumen crece mucho).

---

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components + Server Actions |
| Lenguaje | TypeScript | Front y back, un solo lenguaje |
| Estilos | Tailwind CSS v4 | |
| Componentes | shadcn/ui (preset **Nova**) | Usa **Base UI**, no Radix. Sin `asChild`. |
| Íconos | lucide-react | Íconos de las tarjetas del dashboard y listas |
| Gráficos | Recharts | Área con degradado, donut, barras — todo vía tokens CSS |
| Notificaciones | Sonner | Toasts para acciones que no navegan (cambiar precio, activar/desactivar) |
| Base de datos | PostgreSQL (Neon, cloud) | Región **São Paulo** (sa-east-1) |
| ORM | Drizzle ORM + drizzle-kit | |
| Driver DB | `@neondatabase/serverless` (Pool/websocket) | **No** `neon-http`: no soporta transacciones |
| Auth | Better Auth | Adaptador Drizzle, email/password |
| Fechas | date-fns | `addMonths` maneja el recorte al último día |
| Tests | Vitest | |
| Scripts | tsx | Para correr seeds |

**Entorno de desarrollo:** Windows, Node 24, VS Code, 8GB RAM.

---

## Requisitos y setup

### Requisitos
- Node.js 24+
- Cuenta en [Neon](https://neon.com) (Postgres gratis)
- Git

### Instalación

```bash
git clone https://github.com/7GabrielC/seven-gym.git
cd seven-gym
npm install
```

### Variables de entorno

Crear un archivo `.env` en la raíz:

```
DATABASE_URL="postgresql://usuario:pass@ep-xxx.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="clave-generada-con-el-cli"
BETTER_AUTH_URL="http://localhost:3000"
```

Para generar el secreto:
```bash
npx @better-auth/cli@latest secret
```

> El `.env` está en `.gitignore`. Nunca subir credenciales al repo.

### Crear el esquema en la base

```bash
npx drizzle-kit push
```

### Cargar datos iniciales (seeds)

```bash
npx tsx src/scripts/seed-planes.ts    # catálogo: Bienvenida, Mensual, Trimestral + precios
npx tsx src/scripts/seed-dueno.ts     # primer usuario con rol "dueño"
```

> Los seeds se corren **una sola vez**. Correrlos de nuevo duplica datos.

---

## Comandos

```bash
npm run dev      # servidor de desarrollo (usa --webpack, ver nota abajo)
npm run build    # build de producción
npm start        # correr el build de producción
npm test         # tests con Vitest (modo watch)
npm run lint     # ESLint
```

**Nota sobre `--webpack`:** el script `dev` fuerza webpack en vez de Turbopack (default de Next 16). Turbopack causaba loops de compilación que congelaban la máquina de desarrollo. No quitar la bandera sin probar.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (app)/                  # grupo de rutas protegidas (layout con menú + sesión)
│   │   ├── layout.tsx          # menú lateral + barra usuario + requerirSesion()
│   │   ├── page.tsx            # dashboard (ruta /)
│   │   ├── socios/
│   │   │   ├── page.tsx        # lista
│   │   │   ├── tabla-socios.tsx# tabla + buscador (client)
│   │   │   ├── nuevo/
│   │   │   └── [id]/           # ficha, editar, botones baja/anular
│   │   ├── pagos/nuevo/        # cobrar cuota
│   │   ├── movimientos/
│   │   │   ├── ingresos/       # cuotas + otros ingresos, con métricas
│   │   │   └── egresos/        # gastos con categorías, con métricas
│   │   ├── caja/               # arqueo del turno + historial/ (con detalle por caja, solo lectura)
│   │   ├── planes/             # solo dueño: precios, historial, activar/desactivar
│   │   └── usuarios/           # solo dueño
│   ├── login/                  # fuera del grupo (sin menú, sin sesión)
│   ├── api/auth/[...all]/      # route handler de Better Auth
│   └── layout.tsx              # layout raíz (html, fuentes)
├── actions/                    # Server Actions
│   ├── socios.ts               # crear, editar, dar de baja
│   ├── pagos.ts                # registrar, anular
│   ├── caja.ts                 # abrir, ajuste, cerrar
│   ├── gastos.ts               # registrar gasto (genera egreso de caja si es efectivo)
│   ├── ingresos.ts             # registrar otro ingreso (genera ingreso de caja si es efectivo)
│   ├── planes.ts               # cambiar precio, activar/desactivar, crear (solo dueño)
│   └── usuarios.ts             # crear usuario (solo dueño)
├── components/
│   ├── ui/                     # componentes de shadcn (no editar salvo diseño)
│   ├── menu-lateral.tsx
│   └── barra-usuario.tsx
├── db/
│   ├── schema.ts               # todas las tablas (dominio + Better Auth)
│   └── index.ts                # conexión (Pool + websocket)
├── lib/
│   ├── auth.ts                 # config de Better Auth
│   ├── auth-client.ts          # cliente para signIn/signOut
│   ├── session.ts              # requerirSesion(), requerirDueno(), esDueno()
│   ├── fechas/vencimiento.ts   # calcularVencimiento() + tests
│   ├── fecha-actual.ts         # hoyArgentina(), hoyArgentinaStr(), saludoSegunHora() — SIEMPRE usar esto para "hoy"
│   ├── socios/estado.ts        # calcularEstadoSocio() + tests
│   └── dashboard/metricas.ts   # consultas del dashboard
└── scripts/                    # seeds
```

---

## Modelo de datos

**Dominio:** `socios`, `planes`, `precios_plan`, `suscripciones`, `pagos`, `gastos`, `otros_ingresos`, `sesiones_caja`, `movimientos_caja`, `observaciones` (sin usar aún).

**Better Auth:** `user` (con campo extra `rol`), `session`, `account`, `verification`.

Relaciones clave:
- `socios` 1—N `suscripciones` N—1 `planes`
- `suscripciones` 1—N `pagos`
- `planes` 1—N `precios_plan` (historial, sin `vigente_hasta`)
- `sesiones_caja` 1—N `movimientos_caja`
- `movimientos_caja` tiene tres FK **opcionales y excluyentes**: `pago_id`, `gasto_id`, `otro_ingreso_id`. Si las tres están vacías, es un ajuste manual.
- `user` ← `pagos.registrado_por`, `gastos.registrado_por`, `otros_ingresos.registrado_por`, `sesiones_caja.usuario_id`

---

## Sistema de diseño

Modo claro y oscuro (toggle con `next-themes`, clase `.dark` en `<html>`). Todos los colores viven como variables CSS en `globals.css` — nunca se usa `text-gray-500` ni clases de color de Tailwind directas, siempre tokens.

**Colores semánticos (fijos, significan algo — no se reasignan por estética):**
- `success` / `success-soft`: plata que entra, resultado positivo, todo en orden
- `warning` / `warning-soft`: por vencer, atención
- `danger` / `danger-soft`: vencido, urgente, error
- `brand-accent`: el verde de marca (`#31ff2e` oscuro / `#17a814` claro). Aparece con cuentagotas: indicador de sección activa en el menú, punto de "caja abierta", línea de resultado en gráficos. Nunca decorativo.

**Colores de acento (decorativos, para distinguir categorías sin urgencia):**
`accent-violet`, `accent-teal`, `accent-sky`, `accent-rose` (+ sus `-soft`). Se usan en las tarjetas del dashboard y en listas con varios tipos de eventos (ej. actividad reciente), donde cada categoría necesita su propio color pero ninguna es "mala" o "urgente". No se usan para estados de socios/pagos — ahí manda la paleta semántica.

**Patrones repetidos:** tarjeta (`rounded-lg border border-border bg-card p-4`), número protagonista (`text-2xl font-semibold tracking-tight tabular`) con etiqueta chica arriba (`text-[11px] tracking-wider`), badge de días para vencimientos (componente `BadgeEstado`), punto de estado con halo (`size-1.5 rounded-full bg-brand-accent shadow-[0_0_6px_var(--brand-accent)]`).

**Elemento firma:** los badges de vencimiento muestran los días ("4 días", "Vence hoy") en vez de una etiqueta genérica ("Por vencer"). Función `diasHastaVencimiento` en `src/lib/socios/estado.ts`.

---

## Modelo conceptual: Finanzas vs Caja

Son **dos cosas distintas** y confundirlas rompe las dos. Es el concepto más importante del sistema.

**Movimientos (finanzas)** responde *"¿qué entra y qué sale del negocio?"*. Incluye **todos los métodos** (efectivo y transferencia). Se acumula en el tiempo. Dos vistas:
- **Ingresos** = cuotas (`pagos`) + otros ingresos (`otros_ingresos`)
- **Egresos** = gastos (`gastos`)

**Caja** responde *"¿cuadra el efectivo del cajón de este turno?"*. **Solo efectivo**, por turno, se abre y se cierra con arqueo.

**Cómo se relacionan:** cada movimiento se registra **una sola vez** en Movimientos, con su método real. Si el método es efectivo, el sistema genera **automáticamente** el movimiento de caja correspondiente. Si es transferencia, no toca la caja.

La Caja **no es donde se cargan cosas**: es el espejo del efectivo. El formulario de ajuste que tiene es solo para correcciones excepcionales (ver Procedimientos operativos), no para el uso diario.

Este patrón se repite en los tres orígenes: `pagos`, `gastos`, `otros_ingresos`. Cada uno tiene su FK opcional en `movimientos_caja` (`pago_id`, `gasto_id`, `otro_ingreso_id`).

---

## Reglas de negocio (lo que hay que saber sí o sí)

Estas reglas están implementadas y **no son negociables**. Detalle completo y razones en `docs/99-decisiones.md`.

1. **Plata en centavos, como entero (`bigint`). Nunca float.**
2. **El vencimiento se deriva de los pagos**, no se guarda como columna editable del socio.
3. **El pago congela su monto.** Nunca referencia al precio vivo del plan.
4. **Vencimiento por mes calendario con recorte al último día** (31 ene + 1 mes = 28 feb). Planes en días (Bienvenida = 14) usan días.
5. **Encadenamiento:** `desde = max(hoy, vencimiento_vigente)`. Pagar teniendo plan activo extiende, no duplica.
6. **Soft delete en todo.** Nada se borra físicamente.
7. **La caja solo arquea efectivo.** Las transferencias son ingreso del negocio pero no tocan el cajón.
8. **Caja abierta obligatoria para cobrar en efectivo.**
9. **Un arqueo cerrado es inmutable.** Anular un pago de una caja cerrada NO modifica su arqueo (solo avisa).
10. **Solo el dueño anula pagos**, con motivo obligatorio (separación de funciones).
11. **Pago dividido (efectivo + transferencia) = dos pagos separados**, cada uno con su método real.
12. **Cambiar un precio NO edita el precio viejo:** inserta una fila nueva en `precios_plan` con `vigente_desde = hoy`. El precio vigente en una fecha X es el registro con el `vigente_desde` más grande que sea ≤ X. Excepción: si ya se cambió el precio hoy, se actualiza esa fila (evita filas duplicadas con la misma fecha).
13. **Los planes no se borran, se desactivan.** Un plan inactivo no aparece en el formulario de pagos, pero los pagos históricos que lo referencian siguen intactos.
14. **Todo se registra en Movimientos, no en la Caja.** Un gasto se carga en Egresos (con su método real); si es en efectivo, la caja lo refleja sola. El ajuste de caja es solo para correcciones excepcionales.
15. **Las métricas no se guardan, se calculan.** No hay proceso de "cierre de mes". El mes es un filtro (`fecha >= primer día del mes actual`) que se calcula en cada request. Los datos crudos nunca se borran, así que cualquier período se puede recalcular siempre.
16. **Cobrar cuota y otro ingreso son flujos separados a propósito.** Cobrar una cuota necesita socio + plan y dispara la lógica de vencimiento; un otro ingreso solo necesita descripción + monto. Un formulario único que mute según el tipo sería más confuso, no menos (y el inventario sería un tercer flujo distinto).
17. **Dar de baja a un socio cierra también su suscripción activa** (si tiene). Evita que quede una suscripción "vigente" huérfana de un socio inexistente.
18. **Reactivar a un socio dado de baja NO revive su suscripción vieja.** Vuelve sin plan, como si fuera su primer día — coherente con que dejó de pagar y hay que cobrarle de nuevo. El DNI sigue siendo único incluso para dados de baja: si alguien intenta crear un socio con un DNI que pertenece a alguien de baja, el sistema ofrece reactivarlo en vez de bloquear o duplicar.
19. **Los usuarios (recepcionistas/dueños) no se borran, se desactivan.** Un usuario inactivo no puede iniciar sesión, pero todos sus registros históricos (pagos, cajas, gastos) se conservan con su nombre intacto. Nadie puede desactivarse a sí mismo, y no se puede desactivar al único dueño activo del sistema.

---

## Roles y permisos

| Acción | Dueño | Recepcionista |
|---|---|---|
| Socios: alta, edición, baja | ✓ | ✓ |
| Cobrar cuotas | ✓ | ✓ |
| Registrar ingresos y egresos | ✓ | ✓ |
| Abrir/cerrar su caja, ajustes | ✓ | ✓ |
| Ver historial de cajas | todas | solo las suyas |
| Anular pagos | ✓ | ✗ |
| Planes y precios | ✓ | ✗ |
| Crear usuarios | ✓ | ✗ |

La protección se aplica en **tres niveles**: ocultar en el menú, redirigir en la página (`requerirDueno`), y rechazar en la Server Action. La seguridad real es la de la action.

---

## Testing

```bash
npm test
```

Hay tests de las dos funciones núcleo (las que un error silencioso rompería sin que nadie lo note):
- `calcularVencimiento` — casos de borde: 31 de enero, bisiesto, trimestral con recorte único, plan en días
- `calcularEstadoSocio` — bordes de los umbrales (7 días por vencer, 30 días recuperable)

---

## Documentación adicional

En `/docs`:
- `99-decisiones.md` — **leer antes de "corregir" algo que parece raro.** Registro de decisiones con sus razones, parches conscientes y deuda técnica anotada.
- `98-ideas-futuras.md` — funcionalidades pensadas pero no implementadas, con el porqué.
- `03-planes.md` — spec de planes y suscripciones (lógica de fechas en detalle).

---

## Gotchas conocidos

- **La carpeta del proyecto debe ser minúscula** (`seven-gym`). Con mayúsculas, npm rechaza el nombre y webpack tira `invariant expected layout router to be mounted`.
- **shadcn con preset Nova usa Base UI**, no Radix. La prop `asChild` no existe: controlar diálogos con estado.
- **Las fechas se guardan en UTC.** Un pago a las 00:37 (ART) aparece como 03:37 en la base. No es un bug — ver el punto de zona horaria más abajo para el cuidado real que esto exige.
- **`bufferutil` es necesario** en Windows + Node 24, o el driver websocket falla con `bufferUtil.mask is not a function`.
- En modo `dev`, la navegación es lenta porque Next compila cada página bajo demanda. En producción (`build` + `start`) es instantánea.
- **Nunca usar `new Date().toISOString().slice(0, 10)` para calcular "hoy".** El servidor corre en UTC; Argentina es UTC-3, así que después de las ~21hs esa expresión ya "cree" que es el día siguiente — esto afectó tanto lecturas (filtros de mes, estado de vencimiento) como escrituras (fecha guardada en pagos/gastos/precios) hasta que se corrigió en todo el sistema. Usar siempre `hoyArgentinaStr()` / `hoyArgentina()` de `src/lib/fecha-actual.ts`. Columnas `timestamp` completas (como `creadoEn`, `cerradaEn`) no tienen este problema — el riesgo es solo al recortar a "solo el día". Al leer un `Date` ya corregido por `hoyArgentina()`, usar métodos `getUTC*()` (no `get*()`), porque el objeto ya tiene la hora argentina codificada en su UTC interno.

---

## Animaciones

Todo movimiento tiene un propósito (confirmar una acción, orientar, o comunicar magnitud) — nunca decorativo, para no cansar en un uso de 8hs diarias.

- **`NumeroAnimado`** (`src/components/numero-animado.tsx`): cuenta desde el valor anterior al nuevo con `requestAnimationFrame` y easing `easeOutCubic`. Usado en las 4 tarjetas del dashboard. Recibe `formato="pesos"` como string, nunca una función (no se pueden pasar funciones de Server a Client Components).
- **`.animate-pulso`** (`globals.css`): pulso lento (2.5s) en el punto de "Caja abierta".
- **`.animate-entrada`** (`globals.css`): entrada con fade + leve traslación, con `animationDelay` calculado por índice (`i * 60ms`) para que las filas de una lista aparezcan en cascada. Usado en Vencimientos próximos y Actividad reciente.
- **Gráficos**: `AreaIngresos` y `DonutSociosPorPlan` tienen `isAnimationActive` explícito con `animationDuration`/`animationEasing` propios de Recharts.
- **Confirmación en botones**: el de "Cobrar cuota" muestra un check verde ~450ms antes de navegar (la Server Action ya no hace `redirect()`, devuelve `{ok, socioId}` y el Client Component decide cuándo navegar con `useRouter`).
- **Toasts (Sonner)**: solo para acciones que **no** navegan (cambiar precio, activar/desactivar plan o usuario). Si la acción redirige, se usa el patrón de check en el botón en su lugar, para no duplicar la confirmación.

---

## Procedimientos operativos

**Pago cargado al socio equivocado, detectado con la caja ya cerrada:**
1. El dueño anula el pago (motivo: "cargado al socio equivocado, era de X").
2. El recepcionista cobra la cuota correcta al socio real.
3. En la Caja, usa **"Registrar un ajuste de caja"** → egreso por el mismo monto, motivo: "Corrección: pago de X ya cobrado el [fecha], contabilizado en esa caja".

Esto evita un faltante fantasma en la caja actual y deja rastro escrito del error. El arqueo del turno original no se toca (la plata sí entró ese día). **Este es el único caso donde se usa el ajuste de caja** — los gastos e ingresos reales van siempre por Movimientos.