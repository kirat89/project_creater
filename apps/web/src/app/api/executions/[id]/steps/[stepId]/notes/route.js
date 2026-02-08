import sql from "@/app/api/utils/sql";

// Get notes for a step execution
export async function GET(request, { params }) {
  try {
    const { stepId } = params;

    const notes = await sql(
      "SELECT * FROM step_notes WHERE step_execution_id = $1 ORDER BY created_at DESC",
      [stepId],
    );

    return Response.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// Add note to step execution
export async function POST(request, { params }) {
  try {
    const { stepId } = params;
    const { note } = await request.json();

    if (!note || !note.trim()) {
      return Response.json({ error: "Note text is required" }, { status: 400 });
    }

    const result = await sql(
      "INSERT INTO step_notes (step_execution_id, note) VALUES ($1, $2) RETURNING *",
      [stepId, note.trim()],
    );

    return Response.json({ note: result[0] });
  } catch (error) {
    console.error("Error adding note:", error);
    return Response.json({ error: "Failed to add note" }, { status: 500 });
  }
}
