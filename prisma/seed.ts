// Seed the lab database. Plaintext passwords + secrets on purpose so the
// SQL-injection labs have real loot to steal.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const users = [
  { username: "admin",   password: "S3cr3t-Admin!", role: "admin", secret: "FLAG{sql_injection_dumped_the_admin_secret}" },
  { username: "alice",   password: "password",       role: "user",  secret: "Alice's diary: I reuse this password everywhere." },
  { username: "bob",     password: "letmein",        role: "user",  secret: "Bob's bank PIN: 4021" },
  { username: "charlie", password: "qwerty",         role: "user",  secret: "Charlie's API key: sk_live_DO_NOT_LEAK_42" },
  { username: "dave",    password: "123456",         role: "user",  secret: "Dave's crypto seed: monkey banana ape jungle" },
  { username: "eve",     password: "iloveyou",       role: "user",  secret: "Eve's note: I am secretly the auditor." },
];

const products = [
  { name: "Quantum Stapler",      description: "Staples in two places at once.",        price: 19 },
  { name: "Self-Hashing Towel",   description: "Dries you and your passwords.",         price: 42 },
  { name: "Rubber Duck (Deluxe)", description: "Listens to your debugging woes.",        price: 7 },
  { name: "Firewall Brick",       description: "A literal brick. Stops everything.",     price: 99 },
  { name: "Null Pointer Plushie", description: "Soft, cuddly, references nothing.",       price: 13 },
];

const comments = [
  { author: "moderator", body: "Welcome to the guestbook! Be nice 🙂" },
  { author: "alice",     body: "Great shop, the rubber duck really listens." },
];

async function main() {
  await db.comment.deleteMany();
  await db.product.deleteMany();
  await db.user.deleteMany();

  for (const u of users) await db.user.create({ data: u });
  for (const p of products) await db.product.create({ data: p });
  for (const c of comments) await db.comment.create({ data: c });

  console.log(`Seeded ${users.length} users, ${products.length} products, ${comments.length} comments.`);
}

main().finally(() => db.$disconnect());
