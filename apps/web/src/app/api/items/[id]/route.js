import sql from "@/app/api/utils/sql";

// Get item with execution details
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [items, executions, stepExecutions, substeps] = await sql.transaction(
      [
        sql`SELECT * FROM items WHERE id = ${id}`,
        sql`SELECT * FROM workflow_executions WHERE item_id = ${id}`,
        sql`
        SELECT se.* 
        FROM step_executions se
        JOIN workflow_executions we ON se.execution_id = we.id
        WHERE we.item_id = ${id}
        ORDER BY se.step_order
      `,
        sql`
        SELECT ss.*, se.step_order
        FROM substep_executions ss
        JOIN step_executions se ON ss.step_execution_id = se.id
        JOIN workflow_executions we ON se.execution_id = we.id
        WHERE we.item_id = ${id}
      `,
      ],
    );

    if (!items || items.length === 0) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    return Response.json({
      item: items[0],
      execution: executions[0],
      stepExecutions: stepExecutions || [],
      substeps: substeps || [],
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return Response.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// Update item
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, item_status } = await request.json();

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      setClauses.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (item_status !== undefined) {
      setClauses.push(`item_status = $${paramCount}`);
      values.push(item_status);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const result = await sql(
      `UPDATE items SET ${setClauses.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values,
    );

    return Response.json({ item: result[0] });
  } catch (error) {
    console.error("Error updating item:", error);
    return Response.json({ error: "Failed to update item" }, { status: 500 });
  }
}
