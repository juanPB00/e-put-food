import "dotenv/config";
import pg from "pg";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

console.log("Menjalankan migrasi kolom...");
await db.query(`
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image TEXT;
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
  ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS morning_status TEXT DEFAULT 'Buka Pagi';
`);

console.log("Migrasi selesai!");
await db.end();
