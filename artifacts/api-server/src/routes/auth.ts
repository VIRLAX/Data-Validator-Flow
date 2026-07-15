import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const USERNAME = "OWNAL";
const PASSWORD = "OWNERALFEN12";

function getSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET not set");
  return s;
}

router.post("/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username dan password wajib diisi" });
    return;
  }

  if (username !== USERNAME || password !== PASSWORD) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const token = jwt.sign(
    { username, name: "Owner Alfen" },
    getSecret(),
    { expiresIn: "30d" }
  );

  res.json({ token, user: { username, name: "Owner Alfen" } });
});

router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getSecret()) as { username: string; name: string };
    res.json({ user: { username: payload.username, name: payload.name } });
  } catch {
    res.status(401).json({ error: "Token tidak valid atau sudah expired" });
  }
});

export default router;
