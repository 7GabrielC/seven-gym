import {
  pgTable,
  bigserial,
  varchar,
  integer,
  timestamp,
  date,
  bigint,
  boolean,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const socios = pgTable("socios", {
  id: bigserial("id", { mode: "number" }).primaryKey(),

  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellido: varchar("apellido", { length: 100 }).notNull(),
  dni: varchar("dni", { length: 20 }).notNull().unique(),
  telefono: varchar("telefono", { length: 30 }).notNull(),
  email: varchar("email", { length: 150 }),
  fechaNacimiento: date("fecha_nacimiento").notNull(),

  diaAncla: integer("dia_ancla"),

  creadoEn: timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
  eliminadoEn: timestamp("eliminado_en"),
});

export const planes = pgTable("planes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  duracionValor: integer("duracion_valor").notNull(),
  duracionUnidad: varchar("duracion_unidad", { length: 10 }).notNull(),
  usosMaximosPorSocio: integer("usos_maximos_por_socio"),
  actividad: varchar("actividad", { length: 30 }),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const preciosPlan = pgTable(
  "precios_plan",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    planId: bigint("plan_id", { mode: "number" })
      .notNull()
      .references(() => planes.id),
    precioCentavos: bigint("precio_centavos", { mode: "number" }).notNull(),
    vigenteDesde: date("vigente_desde").notNull(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (table) => [index("precios_plan_plan_idx").on(table.planId)],
);

export const suscripciones = pgTable(
  "suscripciones",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    socioId: bigint("socio_id", { mode: "number" })
      .notNull()
      .references(() => socios.id),
    planId: bigint("plan_id", { mode: "number" })
      .notNull()
      .references(() => planes.id),
    desde: date("desde").notNull(),
    hasta: date("hasta").notNull(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
    eliminadoEn: timestamp("eliminado_en"),
  },
  (table) => [
    index("suscripciones_socio_idx").on(table.socioId),
    index("suscripciones_hasta_idx").on(table.hasta),
  ],
);

export const metodoPagoEnum = pgEnum("metodo_pago", [
  "efectivo",
  "transferencia",
]);

export const tipoMovimientoEnum = pgEnum("tipo_movimiento", [
  "ingreso",
  "egreso",
]);

export const categoriaGastoEnum = pgEnum("categoria_gasto", [
  "limpieza",
  "mantenimiento",
  "servicios",
  "sueldos",
  "equipamiento",
  "otros",
]);

export const pagos = pgTable(
  "pagos",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    suscripcionId: bigint("suscripcion_id", { mode: "number" }).references(
      () => suscripciones.id,
    ),
    montoCentavos: bigint("monto_centavos", { mode: "number" }).notNull(),
    metodo: metodoPagoEnum("metodo").notNull(),
    fechaPago: date("fecha_pago").notNull(),
    registradoPor: text("registrado_por")
      .notNull()
      .references(() => user.id),
    anulado: boolean("anulado").notNull().default(false),
    anuladoEn: timestamp("anulado_en"),
    anuladoPor: text("anulado_por").references(() => user.id),
    motivoAnulacion: text("motivo_anulacion"),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (table) => [
    index("pagos_suscripcion_idx").on(table.suscripcionId),
    index("pagos_fecha_idx").on(table.fechaPago),
  ],
);

export const sesionesCaja = pgTable(
  "sesiones_caja",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id),
    montoApertura: bigint("monto_apertura", { mode: "number" }).notNull(),
    montoCierreDeclarado: bigint("monto_cierre_declarado", { mode: "number" }),
    abiertaEn: timestamp("abierta_en").notNull().defaultNow(),
    cerradaEn: timestamp("cerrada_en"),
  },
  (table) => [index("sesiones_caja_usuario_idx").on(table.usuarioId)],
);

export const movimientosCaja = pgTable(
  "movimientos_caja",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sesionCajaId: bigint("sesion_caja_id", { mode: "number" })
      .notNull()
      .references(() => sesionesCaja.id),
    pagoId: bigint("pago_id", { mode: "number" }).references(() => pagos.id),
    gastoId: bigint("gasto_id", { mode: "number" }).references(() => gastos.id),
    otroIngresoId: bigint("otro_ingreso_id", { mode: "number" }).references(
      () => otrosIngresos.id,
    ),
    tipo: tipoMovimientoEnum("tipo").notNull(),
    montoCentavos: bigint("monto_centavos", { mode: "number" }).notNull(),
    concepto: varchar("concepto", { length: 150 }).notNull(),
    nombreProspecto: varchar("nombre_prospecto", { length: 150 }),
    telefonoProspecto: varchar("telefono_prospecto", { length: 30 }),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (table) => [index("movimientos_sesion_idx").on(table.sesionCajaId)],
);

export const observaciones = pgTable("observaciones", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  socioId: bigint("socio_id", { mode: "number" })
    .notNull()
    .references(() => socios.id),
  autorId: text("autor_id")
    .notNull()
    .references(() => user.id),
  contenido: text("contenido").notNull(),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  rol: text("rol").notNull().default("recepcionista"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const gastos = pgTable(
  "gastos",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    descripcion: varchar("descripcion", { length: 200 }).notNull(),
    categoria: categoriaGastoEnum("categoria").notNull(),
    montoCentavos: bigint("monto_centavos", { mode: "number" }).notNull(),
    metodo: metodoPagoEnum("metodo").notNull(),
    fecha: date("fecha").notNull(),
    registradoPor: text("registrado_por")
      .notNull()
      .references(() => user.id),
    eliminadoEn: timestamp("eliminado_en"),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (table) => [index("gastos_fecha_idx").on(table.fecha)],
);

export const otrosIngresos = pgTable(
  "otros_ingresos",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    descripcion: varchar("descripcion", { length: 200 }).notNull(),
    montoCentavos: bigint("monto_centavos", { mode: "number" }).notNull(),
    metodo: metodoPagoEnum("metodo").notNull(),
    fecha: date("fecha").notNull(),
    registradoPor: text("registrado_por")
      .notNull()
      .references(() => user.id),
    eliminadoEn: timestamp("eliminado_en"),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
  },
  (table) => [index("otros_ingresos_fecha_idx").on(table.fecha)],
);
