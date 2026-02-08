from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/")
async def list_steps(request: Request, workflow_id: str):
    pool = request.app.state.pool
    rows = await pool.fetch("SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order", workflow_id)
    return {"steps": [dict(r) for r in rows]}

