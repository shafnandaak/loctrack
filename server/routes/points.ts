import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const LIVE_FILE = path.join(DATA_DIR, "live.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  if (!fs.existsSync(LIVE_FILE)) fs.writeFileSync(LIVE_FILE, "{}");
}

function dateKey(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function readJSON(file: string) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export const handlePoints: RequestHandler = (req, res) => {
  ensureDataDir();
  if (req.method === "POST") {
    const { user, point } = req.body as any;
    if (!user || !user.id || !point) return res.status(400).json({ error: "user and point required" });
    // upsert user
    const users = readJSON(USERS_FILE) || [];
    const idx = users.findIndex((u: any) => u.id === user.id);
    const storedUser = { id: user.id, name: user.name || user.id, color: user.color || "#06b6d4" };
    if (idx >= 0) users[idx] = { ...users[idx], ...storedUser }; else users.push(storedUser);
    writeJSON(USERS_FILE, users);

    // update live
    const live = readJSON(LIVE_FILE) || {};
    live[user.id] = point;
    writeJSON(LIVE_FILE, live);

    // append history
    const key = dateKey(point.timestamp || Date.now());
    const histDir = path.join(DATA_DIR, "history");
    if (!fs.existsSync(histDir)) fs.mkdirSync(histDir, { recursive: true });
    const histFile = path.join(histDir, `${user.id}:${key}.json`);
    let arr = [];
    if (fs.existsSync(histFile)) {
      try { arr = JSON.parse(fs.readFileSync(histFile, "utf-8")); } catch { arr = []; }
    }
    // avoid duplicate timestamps
    if (!arr.some((p: any) => p.timestamp === point.timestamp)) {
      arr.push(point);
      fs.writeFileSync(histFile, JSON.stringify(arr, null, 2));
    }

    return res.json({ ok: true });
  }

  // support updating user profile: POST { type: 'user', user }
  if (req.method === "POST" && req.body && req.body.type === "user") {
    const u = req.body.user as any;
    if (!u || !u.id) return res.status(400).json({ error: "user.id required" });
    const users = readJSON(USERS_FILE) || [];
    const idx2 = users.findIndex((x: any) => x.id === u.id);
    const stored = { id: u.id, name: u.name || u.id, color: u.color || "#06b6d4", kecamatan: u.kecamatan };
    if (idx2 >= 0) users[idx2] = { ...users[idx2], ...stored }; else users.push(stored);
    writeJSON(USERS_FILE, users);
    return res.json({ ok: true });
  }

  // GET handlers
  if (req.method === "GET") {
    const q = req.query;
    if (q.action === "live") {
      ensureDataDir();
      const live = readJSON(LIVE_FILE) || {};
      const users = readJSON(USERS_FILE) || [];
      const merged = Object.entries(live).map(([id, p]) => ({ user: users.find((u: any) => u.id === id) || { id }, point: p }));
      return res.json(merged);
    }
    if (q.action === "users") {
      ensureDataDir();
      const users = readJSON(USERS_FILE) || [];
      return res.json(users);
    }
    if (q.action === "history") {
      const userId = String(q.userId || "");
      const date = String(q.date || "");
      if (!userId || !date) return res.status(400).json({ error: "userId & date required" });
      const histFile = path.join(DATA_DIR, "history", `${userId}:${date}.json`);
      if (!fs.existsSync(histFile)) return res.json([]);
      try {
        const arr = JSON.parse(fs.readFileSync(histFile, "utf-8"));
        return res.json(arr);
      } catch (e) {
        return res.status(500).json({ error: "failed reading file" });
      }
    }
  }

  res.status(400).json({ error: "unsupported" });
};
