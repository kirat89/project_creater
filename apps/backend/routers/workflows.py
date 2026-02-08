from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from utils.db_errors import rethrow_db_error
from workflows import queries

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
    try:
        pool = request.app.state.pool
        sql = queries.LIST_WORKFLOWS_BASE
        params = []
        if type:
            sql += " AND type = $1"
            params = [type]
        sql += " ORDER BY created_at DESC"

        rows = await pool.fetch(sql, *params)
        return {"workflows": [dict(r) for r in rows]}
    except Exception as exc:
        rethrow_db_error(exc)


@router.post("/", status_code=201)
async def create_workflow(request: Request, payload: WorkflowCreate):
    try:
        if not payload.name or not payload.workflow_type:
            raise HTTPException(status_code=400, detail="name and workflow_type are required")

        pool = request.app.state.pool
        row = await pool.fetchrow(
            queries.CREATE_WORKFLOW,
            payload.name,
            payload.description,
            payload.workflow_type,
            payload.created_by,
        )
        return {"workflow": dict(row) if row else None}
    except Exception as exc:
        rethrow_db_error(exc)


@router.get("/{workflow_id}")
async def get_workflow(request: Request, workflow_id: str):
    try:
        pool = request.app.state.pool
        workflow = await pool.fetchrow(queries.GET_WORKFLOW_BY_ID, workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        steps = await pool.fetch(queries.GET_WORKFLOW_STEPS, workflow_id)
        return {"workflow": dict(workflow), "steps": [dict(s) for s in steps]}
    except Exception as exc:
        rethrow_db_error(exc)


@router.put("/{workflow_id}")
async def update_workflow(request: Request, workflow_id: str, payload: WorkflowUpdate):
    try:
        pool = request.app.state.pool
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

        updates.append("updated_at = NOW()")
        params.append(workflow_id)
        sql = f"UPDATE workflows SET {', '.join(updates)} WHERE id = ${param_idx} RETURNING *"

        row = await pool.fetchrow(sql, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"workflow": dict(row)}
    except Exception as exc:
        rethrow_db_error(exc)


@router.delete("/{workflow_id}")
async def delete_workflow(request: Request, workflow_id: str):
    try:
        pool = request.app.state.pool
        row = await pool.fetchrow(queries.SOFT_DELETE_WORKFLOW, workflow_id)
        if not row:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"workflow": dict(row)}
    except Exception as exc:
        rethrow_db_error(exc)
