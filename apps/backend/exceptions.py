from fastapi import HTTPException


class AppError(HTTPException):
    """Base application error with HTTP semantics."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class DatabaseError(AppError):
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(status_code=500, detail=detail)
