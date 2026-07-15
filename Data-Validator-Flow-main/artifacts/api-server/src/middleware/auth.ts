import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

function getSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET not set");
  return s;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized — silakan login terlebih dahulu" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getSecret()) as { username: string; name: string };
    (req as Request & { user?: { username: string; name: string } }).user = {
      username: payload.username,
      name: payload.name,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid atau sudah expired" });
  }
}
