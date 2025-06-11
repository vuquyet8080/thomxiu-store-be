import { loadEnv, defineConfig } from "@medusajs/framework/utils";

// Uncomment to load environment variables
loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || "medusa:",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions: {
      connection: {
        ssl: false,
      },
    },
  },
  plugins: [
    {
      resolve: "@medusajs/admin",
      /** @type {import('@medusajs/admin').PluginOptions} */
      options: {
        autoRebuild: true,
      },
    },
  ],
  admin: {
    disable: process.env.MEDUSA_ADMIN_DISABLE === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    path: process.env.MEDUSA_ADMIN_DISABLE === "true" ? "/" : "/admin",
  },
});
