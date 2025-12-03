// routes/auth.js
import bcryptjs from 'bcryptjs';
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../services/sendEmail.js";

export default async function authRoutes(fastify, opts) {
  const pool = fastify.pool;

  // 🧩 POST /auth/register
  fastify.post("/auth/register", async (req, reply) => {
    try {
      const { full_name, email, user_role  } = req.body;

      if (!full_name || !email) {
        return reply.code(400).send({ ok: false, error: "Full name and email are required" });
      }

      // ✅ FIX: Table name should be lowercase 'users' not 'Users'
      const userRes = await pool.query(
        `INSERT INTO users (full_name, email, user_role)
        VALUES ($1,$2,$3)
        ON CONFLICT (email) DO UPDATE
          SET full_name = COALESCE(EXCLUDED.full_name, users.full_name),
              user_role  = COALESCE(EXCLUDED.user_role , users.user_role ),
              last_updated = NOW()
        RETURNING user_id, email, status`,
        [full_name, email || null, user_role  || null]
      );


      const { user_id: userId } = userRes.rows[0];

      // Create verification token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
      
      // ✅ FIX: Table name lowercase
      await pool.query(
        `UPDATE users SET verification_token=$1, token_expires_at=$2 WHERE user_id=$3`,
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
      // ✅ FIX: Properly log error details
      fastify.log.error("❌ Registration error:", {
        message: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
        stack: err.stack
      });
      console.error("Full registration error:", err); // Also console log
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

      // ✅ FIX: Table name lowercase
      const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
      const user = result.rows[0];
      
      if (!user || !user.password_hash) {
        return reply.code(401).send({ ok: false, error: "Invalid email or password" });
      }

      // ✅ FIX: Use bcryptjs (you imported it correctly)
      const match = await bcryptjs.compare(password, user.password_hash);
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
          user_role : user.user_role ,
          status: user.status,
        },
      });
    } catch (err) {
      // ✅ FIX: Properly log error
      fastify.log.error("❌ Login error:", {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      console.error("Full login error:", err);
      reply.code(500).send({ ok: false, error: "Server error" });
    }
  });
}