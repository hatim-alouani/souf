export async function setupDatabase(pool, fastify) {
  const schemaSQL = `
    -- Ensure ENUM types exist, creating them only if they don't
    DO $$ BEGIN CREATE TYPE user_status AS ENUM ('pending', 'active'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE speaker AS ENUM ('AI', 'User'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Table 1: Users (for Authentication)
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      user_role VARCHAR(50),
      status user_status NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verification_token VARCHAR(255),
      token_expires_at TIMESTAMPTZ,
      password_hash VARCHAR(255)
    );

    -- Table 2: Conversations (to group messages per user)
    CREATE TABLE IF NOT EXISTS conversations (
      conversation_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Table 3: Messages (the chat flow data)
    CREATE TABLE IF NOT EXISTS messages (
      message_id SERIAL PRIMARY KEY,
      conversation_id INT REFERENCES conversations(conversation_id) ON DELETE CASCADE,
      user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      speaker speaker NOT NULL,
      message_index INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  fastify.log.info('Checking database schema...');
  const client = await pool.connect();
  try {
    await client.query(schemaSQL);
    fastify.log.info('✅ Database schema ready.');
  } catch (err) {
    // ✅ FIX: Properly log the error details
    fastify.log.error('❌ DB setup failed:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
      stack: err.stack
    });
    console.error('Full error:', err); // Also log to console
    process.exit(1);
  } finally {
    client.release();
  }
}