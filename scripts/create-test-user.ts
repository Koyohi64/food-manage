import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

const EMAIL = "test@example.com";
const PASSWORD = "password123";
const NAME = "テストユーザー";

async function main() {
    const existing = await sql`SELECT id FROM users WHERE email = ${EMAIL} LIMIT 1`;
    if (existing.length > 0) {
        console.log(`既に存在します: ${EMAIL} (id: ${existing[0].id})`);
        return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const rows = await sql`
        INSERT INTO users (name, email, password)
        VALUES (${NAME}, ${EMAIL}, ${passwordHash})
        RETURNING id, name, email, created_at
    `;
    const user = rows[0];

    await sql`
        INSERT INTO user_settings (user_id, warning_day, notification_enabled, theme)
        VALUES (${user.id}, 3, true, 'system')
    `;

    console.log("✓ テストユーザー作成完了");
    console.log(`  ID   : ${user.id}`);
    console.log(`  名前 : ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Pass : ${PASSWORD}`);
}

main().catch(console.error);
