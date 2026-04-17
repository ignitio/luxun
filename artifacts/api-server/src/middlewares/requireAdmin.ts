import { type Request, type Response, type NextFunction } from "express";

function getAdminIds(): Set<string> {
  const raw = process.env["ADMIN_REPLIT_USER_IDS"] ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isAdminUserId(id: string | undefined): boolean {
  if (!id) return false;
  return getAdminIds().has(id);
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  if (!isAdminUserId(req.user.id)) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }
  next();
}
