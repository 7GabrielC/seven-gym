import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      rol: {
        type: "string",
        required: false,
        defaultValue: "recepcionista",
      },
      activo: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
  plugins: [nextCookies()],
});
