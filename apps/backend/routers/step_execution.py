from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class StepStatusUpdate(BaseModel):
    status: str  # 'active', 'done', 'skipped'


class SubstepCreate(BaseModel):
    name: str
    order: Optional[int] = None


class SubstepStatusUpdate(BaseModel):
    status: str  # 'pending', 'done'


@router.get("/{execution_id}/steps")
async def get_step_executions(request: Request, execution_id: str):
    """Get all step executions for a workflow execution"""
    pool = request.app.state.pool
    try:
        steps = await pool.fetch(
            """SELECT * FROM step_executions 
               WHERE workflow_execution_id = $1
               ORDER BY step_order""",
            execution_id,
        )
        return {"steps": [dict(s) for s in steps]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{execution_id}/steps/{step_id}")
async def update_step_status(
    request: Request, execution_id: str, step_id: str, payload: StepStatusUpdate
):
    """Update step execution status (complete, skip, reopen)"""
    pool = request.app.state.pool
    
    if payload.status not in ["active", "done", "skipped"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'active', 'done', or 'skipped'",
        )
    
    try:
        # Update step execution status
        step = await pool.fetchrow(
            """UPDATE step_executions 
               SET status = $1, completed_at = NOW() 
               WHERE id = $2 AND workflow_execution_id = $3
               RETURNING *""",
            payload.status,
            step_id,
            execution_id,
        )
        
        if not step:
            raise HTTPException(status_code=404, detail="Step execution not found")
        
        # If step is marked done, unlock next step
        if payload.status == "done":
            next_step = await pool.fetchrow(
                """SELECT * FROM step_executions 
                   WHERE workflow_execution_id = $1 AND step_order > $2
                   ORDER BY step_order
                   LIMIT 1""",
                execution_id,
                step["step_order"],
            )
            
            if next_step:
                await pool.execute(
                    "UPDATE step_executions SET status = 'active' WHERE id = $1",
                    next_step["id"],
                )
            else:
                # All steps done, mark execution as completed
                await pool.execute(
                    """UPDATE workflow_executions 
                       SET status = 'completed', completed_at = NOW() 
                       WHERE id = $1""",
                    execution_id,
                )
        
        return {"step": dict(step)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/{execution_id}/steps/{step_id}/substeps", status_code=201)
async def add_substep(
    request: Request, execution_id: str, step_id: str, payload: SubstepCreate
):
    """Add a substep to a step execution"""
    pool = request.app.state.pool
    
    if not payload.name:
        raise HTTPException(status_code=400, detail="Substep name is required")
    
    try:
        # Get max substep order
        max_order = await pool.fetchval(
            """SELECT COALESCE(MAX(substep_order), 0) 
               FROM substep_executions 
               WHERE step_execution_id = $1""",
            step_id,
        )
        
        next_order = payload.order if payload.order is not None else (max_order or 0) + 1
        
        row = await pool.fetchrow(
            """INSERT INTO substep_executions 
               (step_execution_id, name, substep_order, status)
               VALUES ($1, $2, $3, $4)
               RETURNING *""",
            step_id,
            payload.name,
            next_order,
            "pending",
        )
        
        return {"substep": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{execution_id}/steps/{step_id}/substeps")
async def get_substeps(request: Request, execution_id: str, step_id: str):
    """Get all substeps for a step execution"""
    pool = request.app.state.pool
    try:
        rows = await pool.fetch(
            """SELECT * FROM substep_executions 
               WHERE step_execution_id = $1
               ORDER BY substep_order""",
            step_id,
        )
        return {"substeps": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{execution_id}/steps/{step_id}/substeps/{substep_id}")
async def update_substep_status(
    request: Request,
    execution_id: str,
    step_id: str,
    substep_id: str,
    payload: SubstepStatusUpdate,
):
    """Update substep status (pending or done)"""
    pool = request.app.state.pool
    
    if payload.status not in ["pending", "done"]:
        raise HTTPException(status_code=400, detail="Status must be 'pending' or 'done'")
    
    try:
        row = await pool.fetchrow(
            """UPDATE substep_executions 
               SET status = $1
               WHERE id = $2 AND step_execution_id = $3
               RETURNING *""",
            payload.status,
            substep_id,
            step_id,
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Substep not found")
        
        return {"substep": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{execution_id}/steps/{step_id}/substeps/{substep_id}")
async def delete_substep(
    request: Request, execution_id: str, step_id: str, substep_id: str
):
    """Delete a substep"""
    pool = request.app.state.pool
    try:
        substep = await pool.fetchrow(
            "SELECT * FROM substep_executions WHERE id = $1 AND step_execution_id = $2",
            substep_id,
            step_id,
        )
        
        if not substep:
            raise HTTPException(status_code=404, detail="Substep not found")
        
        await pool.execute("DELETE FROM substep_executions WHERE id = $1", substep_id)
        
        return {"success": True, "message": "Substep deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
