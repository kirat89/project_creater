from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

router = APIRouter()


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_type: str
    created_by: Optional[str] = None


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_type: Optional[str] = None


@router.get("/")
async def list_workflows(request: Request, type: Optional[str] = None):
    """List all active workflows, optionally filtered by type"""
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
    """Create a new workflow"""
    pool = request.app.state.pool
    if not payload.name or not payload.workflow_type:
        raise HTTPException(status_code=400, detail="name and workflow_type are required")
    try:
        row = await pool.fetchrow(
            """INSERT INTO workflows (name, description, type, created_by, is_active) 
               VALUES ($1, $2, $3, $4, true) 
               RETURNING *""",
            payload.name,
            payload.description,
            payload.workflow_type,
            payload.created_by,
        )
        return {"workflow": dict(row) if row else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{workflow_id}")
async def get_workflow(request: Request, workflow_id: str):
    """Get workflow details with steps"""
    pool = request.app.state.pool
    try:
        workflow = await pool.fetchrow(
            "SELECT * FROM workflows WHERE id = $1", workflow_id
        )
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        steps = await pool.fetch(
            "SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order",
            workflow_id,
        )

        return {
            "workflow": dict(workflow),
            "steps": [dict(s) for s in steps],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{workflow_id}")
async def update_workflow(request: Request, workflow_id: str, payload: WorkflowUpdate):
    """Update workflow details"""
    pool = request.app.state.pool
    try:
        # Build dynamic UPDATE query
        updates = []
        params = []
        param_idx = 1

        if payload.name is not None:
            updates.append(f"name = ${param_idx}")
            params.append(payload.name)
            param_idx += 1

        if payload.description is not None:
            updates.append(f"description = ${param_idx}")
            params.append(payload.description)
            param_idx += 1

        if payload.workflow_type is not None:
            updates.append(f"type = ${param_idx}")
            params.append(payload.workflow_type)
            param_idx += 1

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append(f"updated_at = NOW()")
        params.append(workflow_id)

        sql = f"UPDATE workflows SET {', '.join(updates)} WHERE id = ${param_idx} RETURNING *"

        row = await pool.fetchrow(sql, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Workflow not found")

        return {"workflow": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{workflow_id}")
async def delete_workflow(request: Request, workflow_id: str):
    """Soft delete workflow (mark as inactive)"""
    pool = request.app.state.pool
    try:
        row = await pool.fetchrow(
            "UPDATE workflows SET is_active = false WHERE id = $1 RETURNING *",
            workflow_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Workflow not found")

        return {"workflow": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
