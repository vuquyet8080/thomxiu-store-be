import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

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
  ],
  admin: {
    disable: process.env.MEDUSA_ADMIN_DISABLE === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    path: process.env.MEDUSA_ADMIN_DISABLE === "true" ? "/" : "/app",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              // other options...
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/payos",
            id: "payos",
            options: {
              clientId: process.env.PAYOS_CLIENT_ID,
              apiKey: process.env.PAYOS_API_KEY,
              checksumKey: process.env.PAYOS_CHECKSUM_KEY,
            },
          },
        ],
      },
    },
  ],
});
