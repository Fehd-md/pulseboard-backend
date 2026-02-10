import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import env from "@fastify/env";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const fastify = Fastify({ logger: true });

await fastify.register(env, {
  schema: {
    type: "object",
    required: ["PORT", "CORS_ORIGIN"],
    properties: {
      PORT: { type: "string", default: "4000" },
      CORS_ORIGIN: { type: "string", default: "http://localhost:5173" }
    }
  },
  dotenv: true
});

await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // outils / curl
    const allowed = fastify.config.CORS_ORIGIN;
    cb(null, origin === allowed);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false
});

fastify.get("/health", async () => ({ ok: true }));

const CardType = z.enum(["task", "note", "goal"]);
const CardStatus = z.enum(["todo", "doing", "done"]);

const createSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().max(4000).optional().nullable(),
  type: CardType.default("task"),
  status: CardStatus.default("todo"),
  tags: z.array(z.string().min(1).max(24)).default([]),
  dueDate: z.string().datetime().optional().nullable()
});

const updateSchema = createSchema.partial();

function safeJsonArrayString(arr: string[]) {
  return JSON.stringify(arr.slice(0, 12)); // limite anti tags infinis
}

fastify.get("/cards", async (req) => {
  const q = z
    .object({
      q: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      tag: z.string().optional()
    })
    .parse(req.query);

  const cards = await prisma.card.findMany({
    orderBy: [{ updatedAt: "desc" }]
  });

  // Filtrage côté back simple (MVP). (SQLite + JSON tags string)
  let filtered = cards;

  if (q.q) {
    const needle = q.q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        (c.content ?? "").toLowerCase().includes(needle)
    );
  }
  if (q.type && ["task", "note", "goal"].includes(q.type)) {
    filtered = filtered.filter((c) => c.type === q.type);
  }
  if (q.status && ["todo", "doing", "done"].includes(q.status)) {
    filtered = filtered.filter((c) => c.status === q.status);
  }
  if (q.tag) {
    filtered = filtered.filter((c) => {
      try {
        const tags = JSON.parse(c.tags) as string[];
        return tags.includes(q.tag!);
      } catch {
        return false;
      }
    });
  }

  return filtered.map((c) => ({
    ...c,
    tags: (() => {
      try {
        return JSON.parse(c.tags);
      } catch {
        return [];
      }
    })()
  }));
});

fastify.post("/cards", async (req, reply) => {
  const body = createSchema.parse(req.body);

  const created = await prisma.card.create({
    data: {
      title: body.title,
      content: body.content ?? null,
      type: body.type,
      status: body.status,
      tags: safeJsonArrayString(body.tags),
      dueDate: body.dueDate ? new Date(body.dueDate) : null
    }
  });

  reply.code(201);
  return { ...created, tags: body.tags };
});

fastify.patch("/cards/:id", async (req) => {
  const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  const body = updateSchema.parse(req.body);

  const updated = await prisma.card.update({
    where: { id: Number(params.id) },
    data: {
      title: body.title,
      content: body.content ?? undefined,
      type: body.type,
      status: body.status,
      tags: body.tags ? safeJsonArrayString(body.tags) : undefined,
      dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null
    }
  });

  return {
    ...updated,
    tags: (() => {
      try {
        return JSON.parse(updated.tags);
      } catch {
        return [];
      }
    })()
  };
});

fastify.delete("/cards/:id", async (req, reply) => {
  const params = z.object({ id: z.string().regex(/^\d+$/) }).parse(req.params);
  await prisma.card.delete({ where: { id: Number(params.id) } });
  reply.code(204);
  return null;
});

const port = Number(fastify.config.PORT ?? 4000);
await prisma.$connect();
await fastify.listen({ port, host: "0.0.0.0" });
