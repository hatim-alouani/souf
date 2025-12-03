// routes/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../services/sendEmail.js";

export default async function authRoutes(fastify, opts) {
  const pool = fastify.pool;

  // 🧩 POST /auth/register
  fastify.post("/auth/register", async (req, reply) => {
    try {
      const { full_name, email, company_name, user_persona } = req.body;

      if (!full_name || !email) {
        return reply.code(400).send({ ok: false, error: "Full name and email are required" });
      }

      // Insert or update user
      const userRes = await pool.query(
        `INSERT INTO Users (full_name, email, company_name, user_persona, status)
         VALUES ($1,$2,$3,$4,'pending')
         ON CONFLICT (email) DO UPDATE
           SET full_name = COALESCE(EXCLUDED.full_name, Users.full_name),
               company_name = COALESCE(EXCLUDED.company_name, Users.company_name),
               user_persona = COALESCE(EXCLUDED.user_persona, Users.user_persona),
               last_updated = NOW()
         RETURNING user_id, email, status`,
        [full_name, email, company_name || null, user_persona || null]
      );

      const { user_id: userId } = userRes.rows[0];

      // Create verification token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
      await pool.query(
        `UPDATE Users SET verification_token=$1, token_expires_at=$2 WHERE user_id=$3`,
        [token, expiresAt, userId]
      );

      // Send confirmation email
      const confirmUrl = `${process.env.DOMAIN}/confirm?token=${token}`;
      await sendEmail(
        email,
        "Confirm your AI-AUDIT account",
        `Hello ${full_name},\n\nPlease confirm your email and set your password here:\n${confirmUrl}\n\nThis link expires in 24 hours.\n\n— The AI-AUDIT Team`
      );

      reply.send({ ok: true, message: "Confirmation email sent. Please check your inbox." });
    } catch (err) {
      fastify.log.error("❌ Registration error:", err);
      reply.code(500).send({ ok: false, error: "Failed to register user" });
    }
  });

  // 🔐 POST /auth/login
  fastify.post("/auth/login", async (req, reply) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return reply.code(400).send({ ok: false, error: "Email and password are required" });
      }

      const result = await pool.query("SELECT * FROM Users WHERE email=$1", [email]);
      const user = result.rows[0];
      if (!user || !user.password_hash) {
        return reply.code(401).send({ ok: false, error: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return reply.code(401).send({ ok: false, error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { user_id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      reply.send({
        ok: true,
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          company_name: user.company_name,
          user_persona: user.user_persona,
          status: user.status,
        },
      });
    } catch (err) {
      fastify.log.error("❌ Login error:", err);
      reply.code(500).send({ ok: false, error: "Server error" });
    }
  });
}
