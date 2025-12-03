import got from "got";

async function chatRoutes(fastify, options) {
  fastify.addHook("preHandler", async (req, reply) => {
    if (!req.user) {
      return reply.code(401)
        .header('Content-Type', 'application/json')
        .send(JSON.stringify({ message: "Authentication required." }));
    }
  });

  fastify.post("/chat", async (req, reply) => {
    const { question, conversationId } = req.body;
    const userId = req.user.user_id;

    if (!question) {
      return reply.code(400)
        .header('Content-Type', 'application/json')
        .send(JSON.stringify({ message: "Question is required." }));
    }

    let convId = conversationId;

    // Database logging (best effort - don't block AI response)
    try {
      if (!convId) {
        const r = await fastify.pool.query(
          "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING conversation_id",
          [userId, question.substring(0, 50) + "..."]
        );
        convId = r.rows[0].conversation_id;
      }

      if (convId) {
        const idx = await fastify.pool.query(
          "SELECT COUNT(*) FROM messages WHERE conversation_id = $1",
          [convId]
        );
        const msgIndex = parseInt(idx.rows[0].count) + 1;

        await fastify.pool.query(
          "INSERT INTO messages (conversation_id, user_id, content, speaker, message_index) VALUES ($1, $2, $3, $4, $5)",
          [convId, userId, question, "User", msgIndex]
        );
      }
    } catch (e) {
      fastify.log.error("DB logging error:", e);
      // Continue without convId - AI response is more important than DB logging
      convId = null;
    }

    const aiUrl = process.env.AI_SERVICE_URL;

    if (!aiUrl) {
      fastify.log.error("AI_SERVICE_URL not configured");
      return reply.code(500)
        .header('Content-Type', 'application/json')
        .send(JSON.stringify({ message: "AI service not configured." }));
    }

    try {
      // Stream request to FastAPI
      const fastAPIStream = got.stream.post(aiUrl, {
        json: {
          user_id: userId,
          question,
          conversation_id: convId,
        },
        headers: {
          "x-internal-secret": process.env.INTERNAL_API_KEY?.trim(),
        },
        timeout: { request: 600000 },
      });

      // Set proper headers for streaming
      reply.code(200);
      reply.header("Content-Type", "text/plain; charset=utf-8");
      
      // ✅ FIX: Only set header if convId exists
      if (convId !== null) {
        reply.header("X-Conversation-Id", convId.toString());
      }
      
      reply.header("Transfer-Encoding", "chunked");

      // Pipe FastAPI stream directly to Fastify response
      fastAPIStream.pipe(reply.raw);

      // Handle stream errors
      fastAPIStream.on("error", (err) => {
        fastify.log.error("FastAPI stream error:", err);
        if (!reply.raw.headersSent) {
          reply.code(502)
            .header('Content-Type', 'application/json')
            .send(JSON.stringify({ 
              message: "AI service stream failed.", 
              error: err.message 
            }));
        } else if (!reply.raw.writableEnded) {
          reply.raw.write("\n\nERROR: AI service connection lost.");
          reply.raw.end();
        }
      });

      // Handle successful stream end
      fastAPIStream.on("end", () => {
        fastify.log.info("FastAPI stream completed successfully");
      });

      return reply;
    } catch (err) {
      fastify.log.error("Proxy error:", err);
      
      if (reply.raw.headersSent) {
        fastify.log.error("Cannot send error response - headers already sent");
        if (!reply.raw.writableEnded) {
          reply.raw.end();
        }
      } else {
        return reply.code(503)
          .header('Content-Type', 'application/json')
          .send(JSON.stringify({ 
            message: "AI service unavailable.", 
            error: err.message 
          }));
      }
    }
  });
}

export default chatRoutes;