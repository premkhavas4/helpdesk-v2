import { prisma } from "../auth.js";

/**
 * Creates or updates database stored functions in PostgreSQL for status computation
 */
export async function ensureStoredFunctions(): Promise<void> {
  try {
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION compute_ticket_status(
        p_ticket_id INT,
        p_stage VARCHAR,
        p_category VARCHAR DEFAULT NULL,
        p_ai_agent_id VARCHAR DEFAULT NULL
      )
      RETURNS VARCHAR AS $$
      DECLARE
        v_new_status VARCHAR;
        v_assigned_to VARCHAR;
        v_has_ai_reply BOOLEAN;
      BEGIN
        IF p_stage = 'start_processing' THEN
          v_new_status := 'processing';
          v_assigned_to := p_ai_agent_id;
        ELSIF p_stage = 'auto_resolve' THEN
          v_new_status := 'resolved';
          SELECT COALESCE(assigned_to, p_ai_agent_id) INTO v_assigned_to FROM ticket WHERE id = p_ticket_id;
        ELSIF p_stage = 'unassign_open' OR p_stage = 'error_open' THEN
          v_new_status := 'open';
          v_assigned_to := NULL;
        ELSE
          SELECT EXISTS (
            SELECT 1 FROM ticket_reply WHERE ticket_id = p_ticket_id AND sender_type = 'ai'
          ) INTO v_has_ai_reply;

          IF v_has_ai_reply THEN
            v_new_status := 'resolved';
          ELSE
            v_new_status := 'open';
          END IF;
        END IF;

        UPDATE ticket
        SET
          status = v_new_status,
          category = COALESCE(p_category, category),
          assigned_to = v_assigned_to,
          updated_at = NOW()
        WHERE id = p_ticket_id;

        RETURN v_new_status;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await prisma.$executeRawUnsafe(createFunctionSql);
    console.log("✓ PostgreSQL stored function 'compute_ticket_status' initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PostgreSQL stored function:", error);
  }
}
