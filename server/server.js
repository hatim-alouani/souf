import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import pkg from "pg";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { setupDatabase } from "./services/schema.js";
import authRoutes from "./routes/auth.js";
import confirmRoutes from "./routes/confirm.js";
import setPasswordRoutes from "./routes/setPassword.js";
import healthRoutes from "./routes/health.js";
import ChatbotPage from "./routes/chat.js";

dotenv.config();

const { Pool } = pkg;
const fastify = Fastify({ logger: true });

import jwt from "jsonwebtoken";

// 🔐 Middleware to decode JWT from Authorization header
fastify.addHook("onRequest", async (req, reply) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      fastify.log.warn("⚠️ Invalid or expired token.");
      req.user = null;
    }
  }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔐 CORS setup — expanded for Unith and ngrok
await fastify.register(cors, {
  origin: [
    "http://localhost:3001",
    "http://localhost:3000",
    "https://sunfast-julee-moaningly.ngrok-free.dev", // your backend (ngrok)
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// 🧱 PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
fastify.decorate("pool", pool);

// 🧩 Setup database schema
await setupDatabase(pool, fastify);

// 🧩 Register routes
fastify.register(healthRoutes);
fastify.register(authRoutes);
fastify.register(confirmRoutes);
fastify.register(setPasswordRoutes);
fastify.register(ChatbotPage);

// 🚀 Start server
const start = async () => {
  try {
    const port = process.env.PORT || 4000;
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info(`✅ Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
