from fastapi import APIRouter, Request, HTTPException
from typing import Optional
from pydantic import BaseModel
import json

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
async def list_items(
    request: Request, 
    type: Optional[str] = None, 
    status: Optional[str] = None
):
    """List all items, optionally filtered by type or status"""
    pool = request.app.state.pool
    query = """
      SELECT 
        i.*,
        wv.snapshot as workflow_data,
        (
          SELECT COUNT(*)::int 
          FROM step_executions se 
          JOIN workflow_executions we ON se.workflow_execution_id = we.id 
          WHERE we.item_id = i.id AND se.status = 'done'
        ) as completed_steps,
        (
          SELECT COUNT(*)::int 
          FROM step_executions se 
          JOIN workflow_executions we ON se.workflow_execution_id = we.id 
          WHERE we.item_id = i.id
        ) as total_steps
      FROM items i
      LEFT JOIN workflow_versions wv ON i.workflow_version_id = wv.id
      WHERE 1=1
    """
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
    
    try:
        rows = await pool.fetch(query, *params)
        return {"items": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/", status_code=201)
async def create_item(request: Request, payload: ItemCreate):
    """Create a new item from a workflow"""
    pool = request.app.state.pool
    if not payload.title or not payload.item_type or not payload.workflow_id:
        raise HTTPException(
            status_code=400, 
            detail="title, item_type and workflow_id are required"
        )
    
    try:
        # Get latest workflow version
        versions = await pool.fetch(
            """SELECT * FROM workflow_versions 
               WHERE workflow_id = $1 
               ORDER BY version_number DESC 
               LIMIT 1""",
            payload.workflow_id,
        )
        if not versions:
            raise HTTPException(
                status_code=404, 
                detail="Workflow version not found. Please publish the workflow first."
            )
        
        version = versions[0]
        
        # Create item
        item_row = await pool.fetchrow(
            """INSERT INTO items (title, description, type, workflow_version_id, status) 
               VALUES ($1, $2, $3, $4, $5) 
               RETURNING *""",
            payload.title,
            payload.description,
            payload.item_type,
            version["id"],
            "not_started",
        )
        
        # Create workflow execution
        snapshot = version["snapshot"]
        if isinstance(snapshot, str):
            snapshot = json.loads(snapshot)
        
        execution_row = await pool.fetchrow(
            """INSERT INTO workflow_executions (item_id, workflow_version_id, status)
               VALUES ($1, $2, $3)
               RETURNING *""",
            item_row["id"],
            version["id"],
            "not_started",
        )
        
        # Create step executions from snapshot steps
        steps = snapshot.get("steps", [])
        for idx, step in enumerate(steps):
            await pool.execute(
                """INSERT INTO step_executions 
                   (workflow_execution_id, step_id, step_order, name, step_type, status)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                execution_row["id"],
                step.get("id"),
                idx,
                step.get("name"),
                step.get("step_type", "manual"),
                "pending",
            )
        
        # Mark first step as active and update execution status
        if steps:
            await pool.execute(
                """UPDATE step_executions 
                   SET status = 'active'
                   WHERE workflow_execution_id = $1
                   ORDER BY step_order DESC
                   LIMIT 1""",
                execution_row["id"],
            )
            
            await pool.execute(
                """UPDATE workflow_executions 
                   SET status = 'in_progress'
                   WHERE id = $1""",
                execution_row["id"],
            )
            
            await pool.execute(
                "UPDATE items SET status = 'in_progress' WHERE id = $1",
                item_row["id"],
            )
        
        return {
            "item": dict(item_row),
            "execution": dict(execution_row),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{item_id}")
async def get_item(request: Request, item_id: str):
    """Get item details with execution info"""
    pool = request.app.state.pool
    try:
        item = await pool.fetchrow(
            "SELECT * FROM items WHERE id = $1", item_id
        )
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        execution = await pool.fetchrow(
            "SELECT * FROM workflow_executions WHERE item_id = $1", item_id
        )
        
        steps = []
        if execution:
            steps = await pool.fetch(
                """SELECT * FROM step_executions 
                   WHERE workflow_execution_id = $1
                   ORDER BY step_order""",
                execution["id"],
            )
        
        return {
            "item": dict(item),
            "execution": dict(execution) if execution else None,
            "steps": [dict(s) for s in steps],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{item_id}")
async def update_item(request: Request, item_id: str, payload: ItemUpdate):
    """Update item details"""
    pool = request.app.state.pool
    try:
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
        
        params.append(item_id)
        sql = f"UPDATE items SET {', '.join(updates)} WHERE id = ${param_idx} RETURNING *"
        
        row = await pool.fetchrow(sql, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return {"item": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{item_id}")
async def delete_item(request: Request, item_id: str):
    """Delete item (soft delete by marking archived)"""
    pool = request.app.state.pool
    try:
        row = await pool.fetchrow(
            "UPDATE items SET status = 'archived' WHERE id = $1 RETURNING *",
            item_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return {"item": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
