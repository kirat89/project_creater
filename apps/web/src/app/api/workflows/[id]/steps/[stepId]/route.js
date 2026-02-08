import sql from "@/app/api/utils/sql";

// Update step
export async function PUT(request, { params }) {
  try {
    const { id, stepId } = params;
    const updates = await request.json();

    // Build dynamic update query
    const allowedFields = [
      "name",
      "description",
      "step_type",
      "can_have_substeps",
      "is_required",
      "estimated_minutes",
    ];
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClauses.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    values.push(stepId, id);
    const query = `UPDATE workflow_steps SET ${setClauses.join(", ")} WHERE id = $${paramCount} AND workflow_id = $${paramCount + 1} RETURNING *`;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Step not found" }, { status: 404 });
    }

    return Response.json({ step: result[0] });
  } catch (error) {
    console.error("Error updating step:", error);
    return Response.json({ error: "Failed to update step" }, { status: 500 });
  }
}
