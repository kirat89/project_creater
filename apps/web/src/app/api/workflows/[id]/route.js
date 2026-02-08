import sql from "@/app/api/utils/sql";

// Get workflow with steps
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [workflow, steps] = await sql.transaction([
      sql`SELECT * FROM workflows WHERE id = ${id}`,
      sql`SELECT * FROM workflow_steps WHERE workflow_id = ${id} ORDER BY step_order`,
    ]);

    if (!workflow || workflow.length === 0) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }

    return Response.json({
      workflow: workflow[0],
      steps: steps || [],
    });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return Response.json(
      { error: "Failed to fetch workflow" },
      { status: 500 },
    );
  }
}

// Update workflow
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, description, is_active } = await request.json();

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      setClauses.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      setClauses.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (is_active !== undefined) {
      setClauses.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const result = await sql(
      `UPDATE workflows SET ${setClauses.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    return Response.json({ workflow: result[0] });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return Response.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }
}
