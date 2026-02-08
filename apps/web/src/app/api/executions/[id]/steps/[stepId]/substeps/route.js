import sql from "@/app/api/utils/sql";

// Add substep to step execution
export async function POST(request, { params }) {
  try {
    const { stepId } = params;
    const { name } = await request.json();

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await sql(
      "INSERT INTO substep_executions (step_execution_id, name, substep_status) VALUES ($1, $2, $3) RETURNING *",
      [stepId, name, "pending"],
    );

    return Response.json({ substep: result[0] });
  } catch (error) {
    console.error("Error adding substep:", error);
    return Response.json({ error: "Failed to add substep" }, { status: 500 });
  }
}

// Update substep status
export async function PUT(request, { params }) {
  try {
    const { stepId } = params;
    const { substep_id, substep_status } = await request.json();

    if (!substep_id || !substep_status) {
      return Response.json(
        { error: "substep_id and substep_status are required" },
        { status: 400 },
      );
    }

    const result = await sql(
      "UPDATE substep_executions SET substep_status = $1 WHERE id = $2 AND step_execution_id = $3 RETURNING *",
      [substep_status, substep_id, stepId],
    );

    return Response.json({ substep: result[0] });
  } catch (error) {
    console.error("Error updating substep:", error);
    return Response.json(
      { error: "Failed to update substep" },
      { status: 500 },
    );
  }
}
