import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import pkg from "pg";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { setupDatabase } from "./services/schema.js";
import authRoutes from "./routes/auth.js";
import confirmRoutes from "./routes/confirm.js";
import setPasswordRoutes from "./routes/setPassword.js";
import healthRoutes from "./routes/health.js";
import chatRoutes from "./routes/chat.js";

import jwt from "jsonwebtoken";

dotenv.config();


const fastify = Fastify({ logger: true });

const { Pool } = pkg;


await fastify.register(fastifyCors, {
  origin: true, // This allows any origin and reflects it back
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Conversation-Id"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
});



fastify.addHook("onRequest", async (req, reply) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      fastify.log.warn("⚠️ Invalid JWT");
      req.user = null;
    }
  }
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

fastify.decorate("pool", pool);

await setupDatabase(pool, fastify);

fastify.register(healthRoutes);
fastify.register(authRoutes);
fastify.register(confirmRoutes);
fastify.register(setPasswordRoutes);
fastify.register(chatRoutes);

const start = async () => {
  try {
    const port = process.env.PORT || 3000;

    await fastify.listen({
      port,
      host: "0.0.0.0",
    });

    fastify.log.info(`✅ Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
