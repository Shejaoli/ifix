import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";
import { db } from "../server/db";
import { admins } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateAdminPassword() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in the environment.");
  const admin = await storage.getAdminByEmail(adminEmail);
  if (!admin) throw new Error("No admin account matches ADMIN_EMAIL.");
  await db.update(admins).set({ passwordHash: await hashPassword(password) }).where(eq(admins.id, admin.id));
  console.log("Admin password updated.");
}
updateAdminPassword().catch(err => { console.error(err.message || err); process.exit(1); });
