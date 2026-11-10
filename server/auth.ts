import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(password: string, hashed: string) {
  const [hash, salt] = hashed.split(".");
  const hashBuf = Buffer.from(hash, "hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuf, buf);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized: Admin access required" });
  }
  next();
}

export async function requireSuperAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized: Admin access required" });
  }
  const admin = await storage.getAdminById(req.session.adminId);
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Super admin access required" });
  }
  next();
}
