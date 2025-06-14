import { loadEnv, defineConfig } from "@medusajs/framework/utils";

// Uncomment to load environment variables
loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || "medusa:",
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000",
      adminCors:
        process.env.ADMIN_CORS || "https://thomxiu-store-be.vercel.app",
      authCors: process.env.AUTH_CORS || "http://localhost:5173",
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
    {
      resolve: `@medusajs/file-local`,
      options: {
        upload_dir: "uploads",
        backend_url: "http://admin.thomxiu.vn//static",
      },
    },
  ],
  admin: {
    disable: process.env.MEDUSA_ADMIN_DISABLE === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    path: process.env.MEDUSA_ADMIN_DISABLE === "true" ? "/" : "/app",
  },
});
