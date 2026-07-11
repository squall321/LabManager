"""add wb_project deleted_at (soft delete / trash)

Revision ID: 02d93b9f378e
Revises: cfe55dd3a4bf
Create Date: 2026-07-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '02d93b9f378e'
down_revision: Union[str, Sequence[str], None] = 'cfe55dd3a4bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has(inspector, table: str, column: str) -> bool:
    if table not in inspector.get_table_names():
        return False
    return any(c["name"] == column for c in inspector.get_columns(table))


def upgrade() -> None:
    """보관함(소프트 삭제)용 deleted_at 추가. 기존 행은 NULL(=삭제 안 됨).

    dev 에서 create_all 로 이미 컬럼이 있을 수 있어 멱등하게 처리한다.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "wb_projects" in inspector.get_table_names() and not _has(inspector, "wb_projects", "deleted_at"):
        with op.batch_alter_table("wb_projects") as batch:
            batch.add_column(sa.Column("deleted_at", sa.DateTime(), nullable=True))
            batch.create_index("ix_wb_projects_deleted_at", ["deleted_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if _has(inspector, "wb_projects", "deleted_at"):
        with op.batch_alter_table("wb_projects") as batch:
            batch.drop_index("ix_wb_projects_deleted_at")
            batch.drop_column("deleted_at")
