import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
const rows = await sql`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
`;

let currentTable = "";
for (const row of rows) {
    if (row.table_name !== currentTable) {
        currentTable = row.table_name as string;
        console.log(`\n[${currentTable}]`);
    }
    console.log(`  ${row.column_name} (${row.data_type}${row.is_nullable === "NO" ? ", NOT NULL" : ""})`);
}
}

main().catch(console.error);
