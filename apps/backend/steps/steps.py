from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Literal, Optional

from steps import queries
from utils.db_errors import rethrow_db_error
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class StepCreate(BaseModel):
    workflow_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    step_type: Literal["manual", "checklist", "approval", "timer"] = "manual"
    can_have_substeps: bool = False
    is_required: bool = False


class StepUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    step_type: Optional[Literal["manual", "checklist", "approval", "timer"]] = None
    can_have_substeps: Optional[bool] = None
    is_required: Optional[bool] = None


@router.get("/")
async def list_steps(request: Request, workflow_id: str):
    try:
        pool = request.app.state.pool
        rows = await pool.fetch(queries.LIST_STEPS, workflow_id)
        return {"steps": [dict(r) for r in rows]}
    except Exception as exc:
        logger.exception("Error in list_steps: %s", exc)
        rethrow_db_error(exc)


@router.post("/", status_code=201)
async def create_step(request: Request, payload: StepCreate):
    try:
        if not payload.name or not payload.workflow_id:
            raise HTTPException(status_code=400, detail="name and workflow_id are required")

        pool = request.app.state.pool
        workflow = await pool.fetchrow(queries.GET_ACTIVE_WORKFLOW, payload.workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        max_order = await pool.fetchval(queries.GET_MAX_STEP_ORDER, payload.workflow_id)
        next_order = (max_order or 0) + 1

        row = await pool.fetchrow(
            queries.CREATE_STEP,
            payload.workflow_id,
            payload.name,
            payload.description,
            next_order,
            payload.step_type,
            payload.can_have_substeps,
            payload.is_required,
        )
        return {"step": dict(row)}
    except Exception as exc:
        logger.exception("Error in create_step: %s", exc)
        rethrow_db_error(exc)


@router.get("/{step_id}")
async def get_step(request: Request, step_id: str):
    try:
        pool = request.app.state.pool
        row = await pool.fetchrow(queries.GET_STEP, step_id)
        if not row:
            raise HTTPException(status_code=404, detail="Step not found")
        return {"step": dict(row)}
    except Exception as exc:
        logger.exception("Error in get_step: %s", exc)
        rethrow_db_error(exc)


@router.put("/{step_id}")
async def update_step(request: Request, step_id: str, payload: StepUpdate):
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
        if payload.step_type is not None:
            updates.append(f"step_type = ${param_idx}")
            params.append(payload.step_type)
            param_idx += 1
        if payload.can_have_substeps is not None:
            updates.append(f"can_have_substeps = ${param_idx}")
            params.append(payload.can_have_substeps)
            param_idx += 1
        if payload.is_required is not None:
            updates.append(f"is_required = ${param_idx}")
            params.append(payload.is_required)
            param_idx += 1

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(step_id)
        sql = queries.UPDATE_STEP_BASE.format(updates=", ".join(updates), param_idx=param_idx)
        row = await pool.fetchrow(sql, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Step not found")
        return {"step": dict(row)}
    except Exception as exc:
        logger.exception("Error in update_step: %s", exc)
        rethrow_db_error(exc)


@router.delete("/{step_id}")
async def delete_step(request: Request, step_id: str):
    try:
        pool = request.app.state.pool
        row = await pool.fetchrow(queries.SOFT_DELETE_STEP, step_id)
        if not row:
            raise HTTPException(status_code=404, detail="Step not found")
        return {"step": dict(row)}
    except Exception as exc:
        logger.exception("Error in delete_step: %s", exc)
        rethrow_db_error(exc)
