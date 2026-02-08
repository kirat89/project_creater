import sql from "@/app/api/utils/sql";

// Update step execution status
export async function PUT(request, { params }) {
  try {
    const { id, stepId } = params;
    const { step_status } = await request.json();

    if (!step_status) {
      return Response.json(
        { error: "step_status is required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const updates = ["step_status = $1"];
    const values = [step_status];
    let paramCount = 2;

    if (step_status === "active" || step_status === "done") {
      updates.push(`started_at = COALESCE(started_at, $${paramCount})`);
      values.push(now);
      paramCount++;
    }

    if (step_status === "done" || step_status === "skipped") {
      updates.push(`completed_at = $${paramCount}`);
      values.push(now);
      paramCount++;
    }

    values.push(stepId, id);

    const result = await sql(
      `UPDATE step_executions 
       SET ${updates.join(", ")}
       WHERE id = $${paramCount - 1} AND execution_id = $${paramCount}
       RETURNING *`,
      values,
    );

    if (!result || result.length === 0) {
      return Response.json(
        { error: "Step execution not found" },
        { status: 404 },
      );
    }

    // If step is completed, activate next step
    if (step_status === "done" || step_status === "skipped") {
      const nextSteps = await sql(
        `SELECT * FROM step_executions 
         WHERE execution_id = $1 AND step_order > $2 AND step_status = 'pending'
         ORDER BY step_order LIMIT 1`,
        [id, result[0].step_order],
      );

      if (nextSteps && nextSteps.length > 0) {
        await sql(
          "UPDATE step_executions SET step_status = $1, started_at = $2 WHERE id = $3",
          ["active", now, nextSteps[0].id],
        );

        await sql(
          "UPDATE workflow_executions SET current_step_id = $1 WHERE id = $2",
          [nextSteps[0].step_id, id],
        );
      } else {
        // All steps completed
        await sql(
          "UPDATE workflow_executions SET execution_status = $1 WHERE id = $2",
          ["completed", id],
        );

        const execution = await sql(
          "SELECT item_id FROM workflow_executions WHERE id = $1",
          [id],
        );

        if (execution && execution.length > 0) {
          await sql("UPDATE items SET item_status = $1 WHERE id = $2", [
            "completed",
            execution[0].item_id,
          ]);
        }
      }
    }

    return Response.json({ stepExecution: result[0] });
  } catch (error) {
    console.error("Error updating step execution:", error);
    return Response.json(
      { error: "Failed to update step execution" },
      { status: 500 },
    );
  }
}
