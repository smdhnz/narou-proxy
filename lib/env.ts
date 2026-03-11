import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    ALLOWED_USER_IDS: z.string().min(1),
    AUTH_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ALLOWED_USER_IDS: process.env.ALLOWED_USER_IDS,
    AUTH_URL: process.env.AUTH_URL,
  },
})
