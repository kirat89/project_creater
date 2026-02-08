import sql from "@/app/api/utils/sql";

// Publish workflow (create version snapshot)
export async function POST(request, { params }) {
  try {
    const { id } = params;

    // Get workflow and steps
    const [workflow, steps] = await sql.transaction([
      sql`SELECT * FROM workflows WHERE id = ${id}`,
      sql`SELECT * FROM workflow_steps WHERE workflow_id = ${id} ORDER BY step_order`,
    ]);

    if (!workflow || workflow.length === 0) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }

    const workflowData = workflow[0];
    const versionNumber = workflowData.current_version;

    // Create snapshot
    const snapshot = {
      workflow: workflowData,
      steps: steps || [],
    };

    // Check if version already exists
    const existingVersion = await sql(
      "SELECT * FROM workflow_versions WHERE workflow_id = $1 AND version_number = $2",
      [id, versionNumber],
    );

    if (existingVersion.length > 0) {
      return Response.json({ version: existingVersion[0] });
    }

    // Create version
    const result = await sql(
      "INSERT INTO workflow_versions (workflow_id, version_number, snapshot) VALUES ($1, $2, $3) RETURNING *",
      [id, versionNumber, JSON.stringify(snapshot)],
    );

    return Response.json({ version: result[0] });
  } catch (error) {
    console.error("Error publishing workflow:", error);
    return Response.json(
      { error: "Failed to publish workflow" },
      { status: 500 },
    );
  }
}
