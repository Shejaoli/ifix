
import { storage } from "./server/storage";
import { hashPassword } from "./server/auth";
import { db } from "./server/db";
import { admins } from "./shared/schema";
import { eq } from "drizzle-orm";

async function updateAdminPassword() {
  const adminEmail = "admin@ifix.com";
  const hashedPassword = await hashPassword("Admin-Dopic-1!2@");
  
  const admin = await storage.getAdminByEmail(adminEmail);
  if (admin) {
    await db.update(admins)
      .set({ passwordHash: hashedPassword })
      .where(eq(admins.id, admin.id));
    console.log("Admin password updated successfully");
  } else {
    console.log("Admin not found, seed will create it on next start");
  }
  process.exit(0);
}

updateAdminPassword().catch(err => {
  console.error(err);
  process.exit(1);
});
