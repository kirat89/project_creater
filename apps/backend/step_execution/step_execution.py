import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from step_execution import queries
from utils.db_errors import rethrow_db_error

logger = logging.getLogger(__name__)

router = APIRouter()


class StepStatusUpdate(BaseModel):
    status: str


class SubstepCreate(BaseModel):
    name: str
    order: Optional[int] = None


class SubstepStatusUpdate(BaseModel):
    status: str


class StepNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)
    created_by: Optional[str] = None


class StepTimerUpdate(BaseModel):
    minutes: Optional[int] = Field(default=None, ge=1)


@router.get("/{execution_id}/steps")
async def get_step_executions(request: Request, execution_id: str):
    try:
        pool = request.app.state.pool
        steps = await pool.fetch(queries.LIST_EXECUTION_STEPS, execution_id)
        return {"steps": [dict(s) for s in steps]}
    except Exception as exc:
        logger.exception("Error in get_step_executions: %s", exc)
        rethrow_db_error(exc)


@router.put("/{execution_id}/steps/{step_id}")
async def update_step_status(request: Request, execution_id: str, step_id: str, payload: StepStatusUpdate):
    try:
        if payload.status not in ["active", "done", "skipped"]:
            raise HTTPException(status_code=400, detail="Status must be 'active', 'done', or 'skipped'")

        pool = request.app.state.pool
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
        logger.exception("Error in update_step_status: %s", exc)
        rethrow_db_error(exc)


@router.patch("/{execution_id}/steps/{step_id}/timer")
async def update_step_timer(request: Request, execution_id: str, step_id: str, payload: StepTimerUpdate):
    try:
        pool = request.app.state.pool
        step = await pool.fetchrow(queries.GET_STEP_EXECUTION, step_id, execution_id)
        if not step:
            raise HTTPException(status_code=404, detail="Step execution not found")

        if step["step_type"] != "timer":
            raise HTTPException(status_code=400, detail="Only timer steps support timer updates")

        updated = await pool.fetchrow(queries.UPDATE_TIMER_FOR_STEP, payload.minutes, step_id, execution_id)
        if payload.minutes is not None:
            await pool.execute(queries.RESET_ITEM_STATUS_IF_RESUMED, execution_id)

        return {"step": dict(updated)}
    except Exception as exc:
        logger.exception("Error in update_step_timer: %s", exc)
        rethrow_db_error(exc)


@router.get("/{execution_id}/steps/{step_id}/notes")
async def get_step_notes(request: Request, execution_id: str, step_id: str):
    try:
        pool = request.app.state.pool
        step = await pool.fetchrow(queries.GET_STEP_EXECUTION, step_id, execution_id)
        if not step:
            raise HTTPException(status_code=404, detail="Step execution not found")
        notes = await pool.fetch(queries.GET_STEP_NOTES, step_id)
        return {"notes": [dict(n) for n in notes]}
    except Exception as exc:
        logger.exception("Error in get_step_notes: %s", exc)
        rethrow_db_error(exc)


@router.post("/{execution_id}/steps/{step_id}/notes", status_code=201)
async def add_step_note(request: Request, execution_id: str, step_id: str, payload: StepNoteCreate):
    try:
        pool = request.app.state.pool
        step = await pool.fetchrow(queries.GET_STEP_EXECUTION, step_id, execution_id)
        if not step:
            raise HTTPException(status_code=404, detail="Step execution not found")

        note = await pool.fetchrow(queries.CREATE_STEP_NOTE, step_id, payload.note.strip(), payload.created_by)
        return {"note": dict(note)}
    except Exception as exc:
        logger.exception("Error in add_step_note: %s", exc)
        rethrow_db_error(exc)


@router.post("/{execution_id}/steps/{step_id}/substeps", status_code=201)
async def add_substep(request: Request, execution_id: str, step_id: str, payload: SubstepCreate):
    try:
        if not payload.name:
            raise HTTPException(status_code=400, detail="Substep name is required")

        pool = request.app.state.pool
        max_order = await pool.fetchval(queries.GET_MAX_SUBSTEP_ORDER, step_id)
        next_order = payload.order if payload.order is not None else (max_order or 0) + 1

        row = await pool.fetchrow(queries.CREATE_SUBSTEP, step_id, payload.name, next_order, "pending")
        return {"substep": dict(row)}
    except Exception as exc:
        logger.exception("Error in add_substep: %s", exc)
        rethrow_db_error(exc)


@router.get("/{execution_id}/steps/{step_id}/substeps")
async def get_substeps(request: Request, execution_id: str, step_id: str):
    try:
        pool = request.app.state.pool
        rows = await pool.fetch(queries.GET_SUBSTEPS, step_id)
        return {"substeps": [dict(r) for r in rows]}
    except Exception as exc:
        logger.exception("Error in get_substeps: %s", exc)
        rethrow_db_error(exc)


@router.put("/{execution_id}/steps/{step_id}/substeps/{substep_id}")
async def update_substep_status(request: Request, execution_id: str, step_id: str, substep_id: str, payload: SubstepStatusUpdate):
    try:
        if payload.status not in ["pending", "done"]:
            raise HTTPException(status_code=400, detail="Status must be 'pending' or 'done'")

        pool = request.app.state.pool
        row = await pool.fetchrow(queries.UPDATE_SUBSTEP_STATUS, payload.status, substep_id, step_id)
        if not row:
            raise HTTPException(status_code=404, detail="Substep not found")
        return {"substep": dict(row)}
    except Exception as exc:
        logger.exception("Error in update_substep_status: %s", exc)
        rethrow_db_error(exc)


@router.delete("/{execution_id}/steps/{step_id}/substeps/{substep_id}")
async def delete_substep(request: Request, execution_id: str, step_id: str, substep_id: str):
    try:
        pool = request.app.state.pool
        substep = await pool.fetchrow(queries.GET_SUBSTEP, substep_id, step_id)
        if not substep:
            raise HTTPException(status_code=404, detail="Substep not found")

        await pool.execute(queries.DELETE_SUBSTEP, substep_id)
        return {"success": True, "message": "Substep deleted"}
    except Exception as exc:
        logger.exception("Error in delete_substep: %s", exc)
        rethrow_db_error(exc)
