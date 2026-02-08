import sql from "@/app/api/utils/sql";

// Add step to workflow
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { name, description, step_type, can_have_substeps, is_required } =
      await request.json();

    if (!name || !step_type) {
      return Response.json(
        { error: "Name and step_type are required" },
        { status: 400 },
      );
    }

    // Get max step_order
    const maxOrder = await sql(
      "SELECT COALESCE(MAX(step_order), 0) as max_order FROM workflow_steps WHERE workflow_id = $1",
      [id],
    );

    const nextOrder = maxOrder[0].max_order + 1;

    const result = await sql(
      `INSERT INTO workflow_steps 
       (workflow_id, name, description, step_order, step_type, can_have_substeps, is_required) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id,
        name,
        description,
        nextOrder,
        step_type,
        can_have_substeps || false,
        is_required !== false,
      ],
    );

    return Response.json({ step: result[0] });
  } catch (error) {
    console.error("Error adding step:", error);
    return Response.json({ error: "Failed to add step" }, { status: 500 });
  }
}

// Delete step
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get("stepId");

    if (!stepId) {
      return Response.json({ error: "stepId is required" }, { status: 400 });
    }

    await sql("DELETE FROM workflow_steps WHERE id = $1 AND workflow_id = $2", [
      stepId,
      id,
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting step:", error);
    return Response.json({ error: "Failed to delete step" }, { status: 500 });
  }
}
