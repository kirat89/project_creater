import sql from "@/app/api/utils/sql";

// List all items
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = `
      SELECT 
        i.*,
        wv.snapshot->>'workflow' as workflow_data,
        (
          SELECT COUNT(*)::int 
          FROM step_executions se 
          JOIN workflow_executions we ON se.execution_id = we.id 
          WHERE we.item_id = i.id AND se.step_status = 'done'
        ) as completed_steps,
        (
          SELECT COUNT(*)::int 
          FROM step_executions se 
          JOIN workflow_executions we ON se.execution_id = we.id 
          WHERE we.item_id = i.id
        ) as total_steps
      FROM items i
      LEFT JOIN workflow_versions wv ON i.workflow_version_id = wv.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND i.item_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (status) {
      query += ` AND i.item_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += " ORDER BY i.created_at DESC";

    const items = await sql(query, params);

    return Response.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return Response.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

// Create new item from workflow
export async function POST(request) {
  try {
    const { title, item_type, workflow_id } = await request.json();

    if (!title || !item_type || !workflow_id) {
      return Response.json(
        { error: "Title, item_type, and workflow_id are required" },
        { status: 400 },
      );
    }

    // Get latest version of workflow
    const versions = await sql(
      "SELECT * FROM workflow_versions WHERE workflow_id = $1 ORDER BY version_number DESC LIMIT 1",
      [workflow_id],
    );

    if (!versions || versions.length === 0) {
      return Response.json(
        {
          error:
            "Workflow version not found. Please publish the workflow first.",
        },
        { status: 404 },
      );
    }

    const version = versions[0];
    const snapshot =
      typeof version.snapshot === "string"
        ? JSON.parse(version.snapshot)
        : version.snapshot;

    // Create item
    const itemResult = await sql(
      "INSERT INTO items (title, item_type, workflow_version_id, item_status) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, item_type, version.id, "not_started"],
    );

    const item = itemResult[0];

    // Create execution instance
    const executionResult = await sql(
      "INSERT INTO workflow_executions (item_id, workflow_version_id, execution_status) VALUES ($1, $2, $3) RETURNING *",
      [item.id, version.id, "not_started"],
    );

    const execution = executionResult[0];

    // Create step executions from snapshot
    const steps = snapshot.steps || [];
    for (const step of steps) {
      await sql(
        `INSERT INTO step_executions (execution_id, step_id, step_name, step_order, step_status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [execution.id, step.id, step.name, step.step_order, "pending"],
      );
    }

    // Set first step as active if exists
    if (steps.length > 0) {
      await sql(
        `UPDATE step_executions 
         SET step_status = 'active' 
         WHERE execution_id = $1 
         ORDER BY step_order 
         LIMIT 1`,
        [execution.id],
      );

      await sql(
        "UPDATE workflow_executions SET execution_status = $1, current_step_id = $2 WHERE id = $3",
        ["in_progress", steps[0].id, execution.id],
      );

      await sql("UPDATE items SET item_status = $1 WHERE id = $2", [
        "in_progress",
        item.id,
      ]);
    }

    return Response.json({ item, execution });
  } catch (error) {
    console.error("Error creating item:", error);
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
}
