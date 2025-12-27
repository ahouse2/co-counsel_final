from sqlalchemy import Table, Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from backend.app.database import Base

user_role_association = Table(
    "user_role_association",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id")),
    Column("role_id", String, ForeignKey("roles.id")),
)
