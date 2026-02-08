import sql from "@/app/api/utils/sql";

// List all workflows
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = "SELECT * FROM workflows WHERE is_active = true";
    const params = [];

    if (type) {
      query += " AND workflow_type = $1";
      params.push(type);
    }

    query += " ORDER BY created_at DESC";

    const workflows = await sql(query, params);

    return Response.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return Response.json(
      { error: "Failed to fetch workflows" },
      { status: 500 },
    );
  }
}

// Create new workflow
export async function POST(request) {
  try {
    const { name, description, workflow_type } = await request.json();

    if (!name || !workflow_type) {
      return Response.json(
        { error: "Name and workflow_type are required" },
        { status: 400 },
      );
    }

    const result = await sql(
      "INSERT INTO workflows (name, description, workflow_type) VALUES ($1, $2, $3) RETURNING *",
      [name, description, workflow_type],
    );

    return Response.json({ workflow: result[0] });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return Response.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}
