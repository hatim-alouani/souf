export async function setupDatabase(pool, fastify) {
  const schemaSQL = `
    DO $$ BEGIN CREATE TYPE user_status AS ENUM ('pending', 'active'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE session_status AS ENUM ('InProgress', 'Completed', 'Interrupted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE TYPE speaker_type AS ENUM ('AI', 'User'); EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      company_name VARCHAR(255),
      user_persona VARCHAR(50),
      status user_status NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verification_token VARCHAR(255),
      token_expires_at TIMESTAMPTZ,
      password_hash VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS auditsessions (
      session_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_time TIMESTAMPTZ,
      status session_status NOT NULL DEFAULT 'InProgress',
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      conversation_state JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS generatedreports (
      report_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
      session_id INT REFERENCES AuditSessions(session_id) ON DELETE CASCADE,
      file_path TEXT, -- where the report PDF or file will be stored later
      report_title VARCHAR(255) DEFAULT 'AI Marketing Audit Report',
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS AuditProgress (
      progress_id SERIAL PRIMARY KEY,
      session_id INT REFERENCES AuditSessions(session_id) ON DELETE CASCADE,
      user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
      step_index INT NOT NULL,
      question_id VARCHAR(100) NOT NULL,
      question_text TEXT,
      answer_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (session_id, question_id),
      UNIQUE (session_id, step_index)
    );
    
  `;

  fastify.log.info('Checking database schema...');
  const client = await pool.connect();
  try {
    await client.query(schemaSQL);
    fastify.log.info('✅ Database schema ready.');
  } catch (err) {
    fastify.log.error('❌ DB setup failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}
