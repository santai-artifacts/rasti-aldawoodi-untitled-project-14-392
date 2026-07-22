import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import db from "./db";

const app = new Hono();

app.get("/api/scores", (c) => {
  const scores = db
    .query("SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 10")
    .all();
  return c.json(scores);
});

app.post("/api/scores", async (c) => {
  const { name, score } = await c.req.json<{ name: string; score: number }>();
  if (!name || typeof score !== "number") {
    return c.json({ error: "Invalid data" }, 400);
  }
  const trimmed = name.trim().slice(0, 20);
  if (!trimmed) return c.json({ error: "Name required" }, 400);

  db.query("INSERT INTO scores (name, score) VALUES (?, ?)").run(trimmed, score);

  const rank = (
    db
      .query("SELECT COUNT(*) as cnt FROM scores WHERE score > ?")
      .get(score) as { cnt: number }
  ).cnt + 1;

  return c.json({ rank });
});

app.use("/*", serveStatic({ root: `${import.meta.dir}/public` }));

export default { port: process.env.PORT || 3000, fetch: app.fetch };
