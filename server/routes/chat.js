import got from "got";

async function chatRoutes(fastify, options) {
  // Ensure user is authenticated
  fastify.addHook("preHandler", async (req, reply) => {
    if (!req.user) {
      return reply
        .code(401)
        .header("Content-Type", "application/json")
        .send({ message: "Authentication required." });
    }
  });

  // POST /chat
  fastify.post("/chat", async (req, reply) => {
    const { question, conversationId } = req.body;
    const userId = req.user.user_id;

    if (!question || !question.trim()) {
      return reply
        .code(400)
        .header("Content-Type", "application/json")
        .send({ message: "Question is required." });
    }

    let convId = conversationId;

    try {
      // 1️⃣ Store user question in DB
      if (!convId) {
        const r = await fastify.pool.query(
          "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING conversation_id",
          [userId, question.substring(0, 50) + "..."]
        );
        convId = r.rows[0].conversation_id;
      }

      const idxRes = await fastify.pool.query(
        "SELECT COUNT(*) FROM messages WHERE conversation_id = $1",
        [convId]
      );
      const msgIndex = parseInt(idxRes.rows[0].count) + 1;

      await fastify.pool.query(
        "INSERT INTO messages (conversation_id, user_id, content, speaker, message_index) VALUES ($1, $2, $3, $4, $5)",
        [convId, userId, question, "User", msgIndex]
      );
    } catch (err) {
      fastify.log.error("DB error storing user question:", err);
      return reply.code(500).send({ message: "Failed to store message", error: err.message });
    }

    // 2️⃣ Send question to FastAPI and wait for full response
    const aiUrl = process.env.AI_SERVICE_URL;
    if (!aiUrl) {
      fastify.log.error("AI_SERVICE_URL not configured");
      return reply.code(500).send({ message: "AI service not configured." });
    }

    try {
      const aiResText = await got
        .post(aiUrl, {
          json: { user_id: userId, question, conversation_id: convId },
          headers: { "x-internal-secret": process.env.INTERNAL_API_KEY?.trim() },
          timeout: { request: 600000 },
        })
        .text();

      // 3️⃣ Parse metadata if available
      let parsedAnswer = aiResText;
      let sources = [];

      try {
        const metaStart = aiResText.indexOf("METADATA_START:");
        const metaEnd = aiResText.indexOf(":METADATA_END");

        if (metaStart !== -1 && metaEnd !== -1) {
          const jsonStr = aiResText.slice(metaStart + 15, metaEnd);
          const metadata = JSON.parse(jsonStr);
          parsedAnswer = metadata.answer || "";
          sources = metadata.sources || [];
        }
      } catch (err) {
        fastify.log.error("Failed to parse metadata:", err);
      }

      // 4️⃣ Store AI response in DB
      try {
        const idxRes2 = await fastify.pool.query(
          "SELECT COUNT(*) FROM messages WHERE conversation_id = $1",
          [convId]
        );
        const aiIndex = parseInt(idxRes2.rows[0].count) + 1;

        await fastify.pool.query(
          "INSERT INTO messages (conversation_id, user_id, content, speaker, message_index) VALUES ($1, $2, $3, $4, $5)",
          [convId, userId, parsedAnswer, "AI", aiIndex]
        );
      } catch (err) {
        fastify.log.error("DB error storing AI response:", err);
      }

      // 5️⃣ Return final answer + sources to frontend
      return reply.code(200).send({
        conversationId: convId,
        answer: parsedAnswer,
        sources,
      });

    } catch (err) {
      fastify.log.error("Error contacting AI service:", err);
      return reply.code(502).send({
        message: "AI service unavailable",
        error: err.message,
      });
    }
  });
}

export default chatRoutes;
