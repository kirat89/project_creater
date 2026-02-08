from fastapi import APIRouter, Request, HTTPException, Depends
from typing import List
from auth import get_current_user

router = APIRouter()

@router.get("/{execution_id}/steps/{step_id}/notes")
async def get_notes(request: Request, execution_id: str, step_id: str):
    pool = request.app.state.pool
    rows = await pool.fetch("SELECT * FROM step_notes WHERE step_execution_id = $1 ORDER BY created_at DESC", step_id)
    return {"notes": [dict(r) for r in rows]}

@router.post("/{execution_id}/steps/{step_id}/notes", status_code=201)
async def add_note(request: Request, execution_id: str, step_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    note = (payload.get("note") or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="Note text is required")
    pool = request.app.state.pool
    row = await pool.fetchrow(
        "INSERT INTO step_notes (step_execution_id, note, created_by) VALUES ($1, $2, $3) RETURNING *",
        step_id, note, current_user["id"]
    )
    return {"note": dict(row)}