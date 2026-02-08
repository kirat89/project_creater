from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from step_execution import queries
from utils.db_errors import rethrow_db_error

router = APIRouter()


class StepStatusUpdate(BaseModel):
    status: str


class SubstepCreate(BaseModel):
    name: str
    order: Optional[int] = None


class SubstepStatusUpdate(BaseModel):
    status: str


@router.get("/{execution_id}/steps")
async def get_step_executions(request: Request, execution_id: str):
    pool = request.app.state.pool
    try:
        steps = await pool.fetch(queries.LIST_EXECUTION_STEPS, execution_id)
        return {"steps": [dict(s) for s in steps]}
    except Exception as exc:
        rethrow_db_error(exc)


@router.put("/{execution_id}/steps/{step_id}")
async def update_step_status(request: Request, execution_id: str, step_id: str, payload: StepStatusUpdate):
    if payload.status not in ["active", "done", "skipped"]:
        raise HTTPException(status_code=400, detail="Status must be 'active', 'done', or 'skipped'")

    pool = request.app.state.pool
    try:
        step = await pool.fetchrow(queries.UPDATE_STEP_STATUS, payload.status, step_id, execution_id)
        if not step:
            raise HTTPException(status_code=404, detail="Step execution not found")

        if payload.status == "done":
            next_step = await pool.fetchrow(queries.GET_NEXT_STEP, execution_id, step["step_order"])
            if next_step:
                await pool.execute(queries.ACTIVATE_STEP_BY_ID, next_step["id"])
            else:
                await pool.execute(queries.COMPLETE_WORKFLOW_EXECUTION, execution_id)

        return {"step": dict(step)}
    except Exception as exc:
        rethrow_db_error(exc)


@router.post("/{execution_id}/steps/{step_id}/substeps", status_code=201)
async def add_substep(request: Request, execution_id: str, step_id: str, payload: SubstepCreate):
    if not payload.name:
        raise HTTPException(status_code=400, detail="Substep name is required")

    pool = request.app.state.pool
    try:
        max_order = await pool.fetchval(queries.GET_MAX_SUBSTEP_ORDER, step_id)
        next_order = payload.order if payload.order is not None else (max_order or 0) + 1

        row = await pool.fetchrow(queries.CREATE_SUBSTEP, step_id, payload.name, next_order, "pending")
        return {"substep": dict(row)}
    except Exception as exc:
        rethrow_db_error(exc)


@router.get("/{execution_id}/steps/{step_id}/substeps")
async def get_substeps(request: Request, execution_id: str, step_id: str):
    pool = request.app.state.pool
    try:
        rows = await pool.fetch(queries.GET_SUBSTEPS, step_id)
        return {"substeps": [dict(r) for r in rows]}
    except Exception as exc:
        rethrow_db_error(exc)


@router.put("/{execution_id}/steps/{step_id}/substeps/{substep_id}")
async def update_substep_status(request: Request, execution_id: str, step_id: str, substep_id: str, payload: SubstepStatusUpdate):
    if payload.status not in ["pending", "done"]:
        raise HTTPException(status_code=400, detail="Status must be 'pending' or 'done'")

    pool = request.app.state.pool
    try:
        row = await pool.fetchrow(queries.UPDATE_SUBSTEP_STATUS, payload.status, substep_id, step_id)
        if not row:
            raise HTTPException(status_code=404, detail="Substep not found")
        return {"substep": dict(row)}
    except Exception as exc:
        rethrow_db_error(exc)


@router.delete("/{execution_id}/steps/{step_id}/substeps/{substep_id}")
async def delete_substep(request: Request, execution_id: str, step_id: str, substep_id: str):
    pool = request.app.state.pool
    try:
        substep = await pool.fetchrow(queries.GET_SUBSTEP, substep_id, step_id)
        if not substep:
            raise HTTPException(status_code=404, detail="Substep not found")

        await pool.execute(queries.DELETE_SUBSTEP, substep_id)
        return {"success": True, "message": "Substep deleted"}
    except Exception as exc:
        rethrow_db_error(exc)
