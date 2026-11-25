import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import pg from "pg";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const FOOD_MAP = [
  { name: "Nasi Ayam Bakar", file: "nasi-ayam-bakar.jpg", url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80" },
  { name: "Soto Ayam Kampung", file: "soto-ayam-kampung.jpg", url: "https://images.unsplash.com/photo-1572656631137-7935297eff55?w=600&auto=format&fit=crop&q=80" },
  { name: "Nasi Goreng Kampung", file: "nasi-goreng-kampung.jpg", url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80" },
  { name: "Es Teh Manis", file: "es-teh-manis.jpg", url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80" },
  { name: "Kerupuk Udang", file: "kerupuk-udang.jpg", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80" },
  { name: "Soto Ayam Bening", file: "soto-ayam-bening.jpg", url: "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=600&auto=format&fit=crop&q=80" },
  { name: "Soto Betawi", file: "soto-betawi.jpg", url: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80" },
  { name: "Teh Botol Dingin", file: "teh-botol-dingin.jpg", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80" },
  { name: "Nasi Goreng Spesial", file: "nasi-goreng-spesial.jpg", url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80" },
  { name: "Nasi Goreng Seafood", file: "nasi-goreng-seafood.jpg", url: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80" },
  { name: "Mie Ayam Bakso", file: "mie-ayam-bakso.jpg", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80" },
  { name: "Mie Ayam Ceker", file: "mie-ayam-ceker.jpg", url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80" },
];

const RESTO_MAP = [
  { name: "Warung Mba Taza", file: "warung-mba-taza.jpg", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80" },
  { name: "Soto Ayam Pak Darto", file: "soto-ayam-pak-darto.jpg", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80" },
  { name: "Nasi Goreng Sore", file: "nasi-goreng-sore.jpg", url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&auto=format&fit=crop&q=80" },
  { name: "Mie Ayam Mang Ujang", file: "mie-ayam-mang-ujang.jpg", url: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=600&auto=format&fit=crop&q=80" },
  { name: "Dapur Teh Rina", file: "dapur-teh-rina.jpg", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80" },
];

const HERO = { file: "hero-food.jpg", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80" };

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      fileStream.on("error", reject);
    }).on("error", reject);
  });
}

console.log("Mengunduh gambar hero...");
const heroPath = path.join(process.cwd(), "public/images/hero", HERO.file);
try {
  await downloadFile(HERO.url, heroPath);
  console.log("Hero image downloaded:", HERO.file);
} catch (e) {
  console.error("Hero download error:", e.message);
}

console.log("Mengunduh gambar makanan...");
for (const item of FOOD_MAP) {
  const dest = path.join(process.cwd(), "public/images/food", item.file);
  try {
    await downloadFile(item.url, dest);
    const relPath = `/images/food/${item.file}`;
    await db.query("UPDATE products SET image=$1 WHERE name ILIKE '%'||$2||'%'", [relPath, item.name]);
    console.log(`Food: ${item.name} -> ${relPath}`);
  } catch (e) {
    console.error(`Error for ${item.name}:`, e.message);
  }
}

console.log("Mengunduh gambar restoran...");
for (const item of RESTO_MAP) {
  const dest = path.join(process.cwd(), "public/images/resto", item.file);
  try {
    await downloadFile(item.url, dest);
    const relPath = `/images/resto/${item.file}`;
    await db.query("UPDATE restaurants SET image=$1 WHERE name ILIKE '%'||$2||'%'", [relPath, item.name]);
    console.log(`Resto: ${item.name} -> ${relPath}`);
  } catch (e) {
    console.error(`Error for ${item.name}:`, e.message);
  }
}

// Fallback image for any product without image
await db.query("UPDATE products SET image='/images/food/nasi-ayam-bakar.jpg' WHERE image IS NULL");
await db.query("UPDATE restaurants SET image='/images/resto/warung-mba-taza.jpg' WHERE image IS NULL");

console.log("Semua gambar berhasil diperbarui!");
await db.end();
