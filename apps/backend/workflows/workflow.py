from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_type: str
    created_by: Optional[str] = None

@router.get("/")
async def list_workflows(request: Request, type: Optional[str] = None):
    pool = request.app.state.pool
    sql = "SELECT * FROM workflows WHERE is_active = true"
    params = []
    if type:
        sql += " AND type = $1"
        params = [type]
    sql += " ORDER BY created_at DESC"
    rows = await pool.fetch(sql, *params)
    return {"workflows": [dict(r) for r in rows]}

@router.post("/", status_code=201)
async def create_workflow(request: Request, payload: WorkflowCreate):
    pool = request.app.state.pool
    if not payload.name or not payload.workflow_type:
        raise HTTPException(status_code=400, detail="name and workflow_type are required")
    row = await pool.fetchrow(
        "INSERT INTO workflows (name, description, type, created_by, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *",
        payload.name,
        payload.description,
        payload.workflow_type,
        payload.created_by,
    )
    return {"workflow": dict(row) if row else None}