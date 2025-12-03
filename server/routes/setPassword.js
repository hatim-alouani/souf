import bcrypt from 'bcrypt';

export default async function (fastify, opts) {
  const pool = fastify.pool;

  fastify.post('/set-password', async (req, reply) => {
    try {
      const { token, password } = req.body;
      if (!token || !password)
        return reply.code(400).send({ ok: false, error: 'Missing token or password' });

      const hashed = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `UPDATE Users
         SET password_hash=$1, status='active', verification_token=NULL, token_expires_at=NULL
         WHERE verification_token=$2`,
        [hashed, token]
      );

      if (result.rowCount === 0)
        return reply.code(400).send({ ok: false, error: 'Invalid or expired token' });

      reply.send({ ok: true, message: 'Password set successfully' });
    } catch (err) {
      fastify.log.error('❌ Error setting password:', err);
      reply.code(500).send({ ok: false, error: 'Server error' });
    }
  });
}
