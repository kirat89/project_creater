GET_USER_BY_EMAIL = "SELECT id FROM users WHERE email = $1"
CREATE_USER = """
INSERT INTO users (email, name, password_hash)
VALUES ($1, $2, $3)
RETURNING id, email, name, created_at
"""
GET_USER_AUTH = "SELECT id, password_hash FROM users WHERE email = $1"
GET_USER_BY_ID = "SELECT id, email, name, created_at FROM users WHERE id = $1"
