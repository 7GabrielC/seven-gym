# Seven — Sistema de gestión para gimnasios

Sistema de administración interna para gimnasios: gestión de socios, cobro de cuotas, control de vencimientos, caja por turno y métricas.

**No es una app para socios.** Es una herramienta de mostrador y administración, usada por el dueño y los recepcionistas desde una computadora.

---

## Estado del proyecto

En desarrollo activo. Proyecto de aprendizaje con intención de venta a un gimnasio real.

**Módulos funcionando:**
- Socios: alta, listado con buscador en vivo, ficha individual, edición, baja (soft delete), estado derivado (activo / por vencer / vencido / inactivo)
- Pagos: registro con cálculo de vencimiento, precio congelado, encadenamiento de períodos, anulación con auditoría
- Caja: apertura por turno, movimientos manuales (ingresos/egresos), cierre con arqueo, historial filtrado por rol
- Autenticación: login email/password, dos roles (dueño / recepcionista), sesiones, protección de páginas y acciones
- Usuarios: creación de cuentas desde el sistema (solo dueño)
- Dashboard: listas accionables (por vencer, vencidos) + métricas de ingresos

**Pendiente:** módulo de gastos, gestión de precios/planes por UI, observaciones, reportes, validación de formato (Zod), diseño visual.

---

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components + Server Actions |
| Lenguaje | TypeScript | Front y back, un solo lenguaje |
| Estilos | Tailwind CSS v4 | |
| Componentes | shadcn/ui (preset **Nova**) | Usa **Base UI**, no Radix. Sin `asChild`. |
| Base de datos | PostgreSQL (Neon, cloud) | |
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
│   │   ├── pagos/nuevo/
│   │   ├── caja/               # caja actual + historial/
│   │   └── usuarios/           # solo dueño
│   ├── login/                  # fuera del grupo (sin menú, sin sesión)
│   ├── api/auth/[...all]/      # route handler de Better Auth
│   └── layout.tsx              # layout raíz (html, fuentes)
├── actions/                    # Server Actions
│   ├── socios.ts               # crear, editar, dar de baja
│   ├── pagos.ts                # registrar, anular
│   ├── caja.ts                 # abrir, registrar movimiento, cerrar
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
│   ├── socios/estado.ts        # calcularEstadoSocio() + tests
│   └── dashboard/metricas.ts   # consultas del dashboard
└── scripts/                    # seeds
```

---

## Modelo de datos

**Dominio:** `socios`, `planes`, `precios_plan`, `suscripciones`, `pagos`, `sesiones_caja`, `movimientos_caja`, `observaciones` (sin usar aún).

**Better Auth:** `user` (con campo extra `rol`), `session`, `account`, `verification`.

Relaciones clave:
- `socios` 1—N `suscripciones` N—1 `planes`
- `suscripciones` 1—N `pagos`
- `planes` 1—N `precios_plan` (historial, sin `vigente_hasta`)
- `pagos` 1—1 `movimientos_caja` (solo si el pago fue en efectivo)
- `sesiones_caja` 1—N `movimientos_caja`
- `user` ← `pagos.registrado_por`, `sesiones_caja.usuario_id`

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

---

## Roles y permisos

| Acción | Dueño | Recepcionista |
|---|---|---|
| Socios: alta, edición, baja | ✓ | ✓ |
| Registrar pagos | ✓ | ✓ |
| Abrir/cerrar su caja, movimientos | ✓ | ✓ |
| Ver historial de cajas | todas | solo las suyas |
| Anular pagos | ✓ | ✗ |
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
- **Las fechas se guardan en UTC.** Un pago a las 00:37 (ART) aparece como 03:37 en la base. No es un bug.
- **`bufferutil` es necesario** en Windows + Node 24, o el driver websocket falla con `bufferUtil.mask is not a function`.
- En modo `dev`, la navegación es lenta porque Next compila cada página bajo demanda. En producción (`build` + `start`) es instantánea.

---

## Procedimientos operativos

**Pago cargado al socio equivocado, detectado con la caja ya cerrada:**
1. El dueño anula el pago (motivo: "cargado al socio equivocado, era de X").
2. El recepcionista carga el pago correcto al socio real.
3. Registra un **egreso manual** por el mismo monto, con concepto: "Corrección: pago de X ya cobrado el [fecha], contabilizado en esa caja".

Esto evita un faltante fantasma en la caja actual y deja rastro escrito del error. El arqueo del turno original no se toca (la plata sí entró ese día).