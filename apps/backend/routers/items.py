from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import json
import logging

from items import queries
from utils.db_errors import rethrow_db_error

logger = logging.getLogger(__name__)

router = APIRouter()


class ItemCreate(BaseModel):
    title: str
    item_type: str
    workflow_id: str
    description: Optional[str] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


@router.get("/")
async def list_items(request: Request, type: Optional[str] = None, status: Optional[str] = None):
    try:
        pool = request.app.state.pool
        query = queries.LIST_ITEMS_BASE
        params = []
        idx = 1

        if type:
            query += f" AND i.type = ${idx}"
            params.append(type)
            idx += 1
        if status:
            query += f" AND i.status = ${idx}"
            params.append(status)
            idx += 1

        query += " ORDER BY i.created_at DESC"
        rows = await pool.fetch(query, *params)
        return {"items": [dict(r) for r in rows]}
    except Exception as exc:
        logger.exception("Error in list_items: %s", exc)
        rethrow_db_error(exc)


@router.post("/", status_code=201)
async def create_item(request: Request, payload: ItemCreate):
    try:
        if not payload.title or not payload.item_type or not payload.workflow_id:
            raise HTTPException(status_code=400, detail="title, item_type and workflow_id are required")

        pool = request.app.state.pool
        version = await pool.fetchrow(queries.GET_LATEST_WORKFLOW_VERSION, payload.workflow_id)
        if not version:
            raise HTTPException(status_code=404, detail="Workflow not found or inactive. Please publish an active workflow first.")

        item_row = await pool.fetchrow(
            queries.CREATE_ITEM,
            payload.title,
            payload.description,
            payload.item_type,
            version["id"],
            "not_started",
        )

        snapshot = version["snapshot"]
        if isinstance(snapshot, str):
            snapshot = json.loads(snapshot)

        execution_row = await pool.fetchrow(
            queries.CREATE_WORKFLOW_EXECUTION,
            item_row["id"],
            version["id"],
            "not_started",
        )

        steps = snapshot.get("steps", [])
        for idx, step in enumerate(steps):
            await pool.execute(
                queries.CREATE_STEP_EXECUTION,
                execution_row["id"],
                step.get("id"),
                idx,
                step.get("name"),
                step.get("step_type", "manual"),
                "pending",
            )

        if steps:
            await pool.execute(queries.ACTIVATE_FIRST_STEP, execution_row["id"])
            await pool.execute(queries.SET_WORKFLOW_EXECUTION_IN_PROGRESS, execution_row["id"])
            await pool.execute(queries.SET_ITEM_IN_PROGRESS, item_row["id"])

        return {"item": dict(item_row), "execution": dict(execution_row)}
    except Exception as exc:
        logger.exception("Error in create_item: %s", exc)
        rethrow_db_error(exc)


@router.get("/{item_id}")
async def get_item(request: Request, item_id: str):
    try:
        pool = request.app.state.pool
        item = await pool.fetchrow(queries.GET_ITEM, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        execution = await pool.fetchrow(queries.GET_ITEM_EXECUTION, item_id)
        steps = []
        if execution:
            steps = await pool.fetch(queries.GET_EXECUTION_STEPS, execution["id"])

        return {
            "item": dict(item),
            "execution": dict(execution) if execution else None,
            "steps": [dict(s) for s in steps],
        }
    except Exception as exc:
        logger.exception("Error in get_item: %s", exc)
        rethrow_db_error(exc)


@router.put("/{item_id}")
async def update_item(request: Request, item_id: str, payload: ItemUpdate):
    try:
        pool = request.app.state.pool
        updates = []
        params = []
        param_idx = 1

        if payload.title is not None:
            updates.append(f"title = ${param_idx}")
            params.append(payload.title)
            param_idx += 1
        if payload.description is not None:
            updates.append(f"description = ${param_idx}")
            params.append(payload.description)
            param_idx += 1
        if payload.status is not None:
            updates.append(f"status = ${param_idx}")
            params.append(payload.status)
            param_idx += 1

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = NOW()")
        params.append(item_id)
        sql = queries.UPDATE_ITEM_BASE.format(updates=", ".join(updates), param_idx=param_idx)

        row = await pool.fetchrow(sql, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"item": dict(row)}
    except Exception as exc:
        logger.exception("Error in update_item: %s", exc)
        rethrow_db_error(exc)


@router.delete("/{item_id}")
async def delete_item(request: Request, item_id: str):
    try:
        pool = request.app.state.pool
        row = await pool.fetchrow(queries.ARCHIVE_ITEM, item_id)
        if not row:
            existing = await pool.fetchrow(queries.GET_ITEM, item_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Item not found")
            return {"success": True, "message": "Item already archived"}

        return {"success": True, "message": "Item archived", "item": dict(row)}
    except Exception as exc:
        logger.exception("Error in delete_item: %s", exc)
        rethrow_db_error(exc)
