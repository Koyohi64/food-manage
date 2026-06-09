import { neon } from "@neondatabase/serverless";
import * as dotenv from "node:process";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
    console.log("Running migration...");

    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name        TEXT NOT NULL,
            email       TEXT NOT NULL UNIQUE,
            password    TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ users");

    await sql`
        CREATE TABLE IF NOT EXISTS user_settings (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            warning_day          INTEGER NOT NULL DEFAULT 3,
            notification_enabled BOOLEAN NOT NULL DEFAULT true,
            theme                TEXT NOT NULL DEFAULT 'system',
            created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ user_settings");

    await sql`
        CREATE TABLE IF NOT EXISTS ingredients (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name       TEXT NOT NULL,
            quantity   NUMERIC,
            unit       TEXT,
            deadline   DATE,
            source     TEXT NOT NULL DEFAULT 'manual',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ ingredients");

    await sql`
        CREATE TABLE IF NOT EXISTS recipes (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name       TEXT NOT NULL,
            content    JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ recipes");

    await sql`
        CREATE TABLE IF NOT EXISTS recipe_histories (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            recepi_id        UUID REFERENCES recipes(id) ON DELETE SET NULL,
            name             TEXT NOT NULL,
            user_input       TEXT,
            used_ingredients JSONB NOT NULL DEFAULT '[]',
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ recipe_histories");

    await sql`
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ sessions");

    await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            token      TEXT PRIMARY KEY,
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at    TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    console.log("✓ password_reset_tokens");

    console.log("\nMigration complete.");
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
