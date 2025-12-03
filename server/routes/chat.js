import got from "got";

async function chatRoutes(fastify, options) {
  fastify.addHook("preHandler", async (req, reply) => {
    if (!req.user) {
      reply.code(401).send({ message: "Authentication required." });
    }
  });

  fastify.post("/chat", async (req, reply) => {
    const { question, conversationId } = req.body;
    const userId = req.user.user_id;

    if (!question) return reply.code(400).send({ message: "Question is required." });

    let convId = conversationId;

    try {
      if (!convId) {
        const r = await fastify.pool.query(
          "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING conversation_id",
          [userId, question.substring(0, 50) + "..."]
        );
        convId = r.rows[0].conversation_id;
      }

      const idx = await fastify.pool.query(
        "SELECT COUNT(*) FROM messages WHERE conversation_id = $1",
        [convId]
      );
      const msgIndex = parseInt(idx.rows[0].count) + 1;

      await fastify.pool.query(
        "INSERT INTO messages (conversation_id, user_id, content, speaker, message_index) VALUES ($1, $2, $3, $4, $5)",
        [convId, userId, question, "User", msgIndex]
      );

    } catch (e) {
      fastify.log.error("DB logging error:", e);
    }

    const aiUrl = process.env.AI_SERVICE_URL;

    try {
      const fastAPIStream = got.stream.post(aiUrl, {
        json: {
          user_id: userId,
          question,
          conversation_id: convId,
        },
        headers: {
          "X-Internal-Secret": process.env.INTERNAL_API_KEY.trim(),
        },
        timeout: { request: 600000 },
      });

      reply.code(200);
      reply.header("Content-Type", "text/plain; charset=utf-8");
      reply.header("X-Conversation-Id", convId.toString());

      fastAPIStream.pipe(reply.raw);
      return reply;

    } catch (err) {
      fastify.log.error("Proxy error:", err);
      reply.code(503).send({ message: "AI service unavailable." });
    }
  });
}

export default chatRoutes;
