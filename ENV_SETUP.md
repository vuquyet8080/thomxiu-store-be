# Environment Setup for Medusa without Redis

To run your Medusa application in production without Redis and using PostgreSQL for session storage, create a `.env` file in the root of your project with the following content:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa-db

# CORS settings
STORE_CORS=http://localhost:8000,http://localhost:3000
ADMIN_CORS=http://localhost:7000,http://localhost:7001
AUTH_CORS=http://localhost:7000,http://localhost:7001,http://localhost:8000,http://localhost:3000

# Security
JWT_SECRET=your_jwt_secret_here
COOKIE_SECRET=your_cookie_secret_here
```

## For Production with Supabase

When deploying to Supabase:

1. Create a new PostgreSQL database in Supabase
2. Get the connection string from Supabase dashboard
3. Update your `.env` file with the Supabase connection string:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REFERENCE-ID].supabase.co:5432/postgres
```

## Starting Your Application

After setting up your environment, start your application with:

```bash
yarn build
yarn start
```

The updated configuration in `medusa-config.ts` will now use PostgreSQL for session storage instead of Redis or the default in-memory store that causes warnings in production.
