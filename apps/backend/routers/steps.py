from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class StepCreate(BaseModel):
    workflow_id: str
    name: str
    description: Optional[str] = None
    step_type: str = "manual"
    can_have_substeps: bool = False
    is_required: bool = False


class StepUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    step_type: Optional[str] = None
    can_have_substeps: Optional[bool] = None
    is_required: Optional[bool] = None


@router.get("/")
async def list_steps(request: Request, workflow_id: str):
    """List all steps for a workflow"""
    pool = request.app.state.pool
    try:
        rows = await pool.fetch(
            """SELECT * FROM workflow_steps 
               WHERE workflow_id = $1 
               ORDER BY step_order""",
            workflow_id,
        )
        return {"steps": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/", status_code=201)
async def create_step(request: Request, payload: StepCreate):
    """Create a new step in a workflow"""
    pool = request.app.state.pool
    if not payload.name or not payload.workflow_id:
        raise HTTPException(
            status_code=400, 
            detail="name and workflow_id are required"
        )
    
    try:
        # Get max step order
        max_order = await pool.fetchval(
            """SELECT COALESCE(MAX(step_order), 0) 
               FROM workflow_steps 
               WHERE workflow_id = $1""",
            payload.workflow_id,
        )
        
        next_order = (max_order or 0) + 1
        
        row = await pool.fetchrow(
            """INSERT INTO workflow_steps 
               (workflow_id, name, description, step_order, step_type, can_have_substeps, is_required)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *""",
            payload.workflow_id,
            payload.name,
            payload.description,
            next_order,
            payload.step_type,
            payload.can_have_substeps,
            payload.is_required,
        )
        
        return {"step": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{step_id}")
async def get_step(request: Request, step_id: str):
    """Get a specific step"""
    pool = request.app.state.pool
    try:
        row = await pool.fetchrow(
            "SELECT * FROM workflow_steps WHERE id = $1", step_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Step not found")
        
        return {"step": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{step_id}")
async def update_step(request: Request, step_id: str, payload: StepUpdate):
    """Update a step"""
    pool = request.app.state.pool
    try:
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
        sql = f"UPDATE workflow_steps SET {', '.join(updates)} WHERE id = ${param_idx} RETURNING *"
        
        row = await pool.fetchrow(sql, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Step not found")
        
        return {"step": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{step_id}")
async def delete_step(request: Request, step_id: str):
    """Delete a step"""
    pool = request.app.state.pool
    try:
        # Get workflow_id first
        step = await pool.fetchrow(
            "SELECT workflow_id FROM workflow_steps WHERE id = $1", step_id
        )
        
        if not step:
            raise HTTPException(status_code=404, detail="Step not found")
        
        # Delete the step
        await pool.execute("DELETE FROM workflow_steps WHERE id = $1", step_id)
        
        return {"success": True, "message": "Step deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
