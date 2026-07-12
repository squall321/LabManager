"""add wb_project mode (discovery | simulation)

Revision ID: 1cf29570a997
Revises: 02d93b9f378e
Create Date: 2026-07-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1cf29570a997'
down_revision: Union[str, Sequence[str], None] = '02d93b9f378e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has(inspector, table: str, column: str) -> bool:
    if table not in inspector.get_table_names():
        return False
    return any(c["name"] == column for c in inspector.get_columns(table))


def upgrade() -> None:
    """프로젝트 렌즈(mode) 추가. 기존 행은 'discovery'(기회 발굴)로 백필.
    dev 는 create_all 로 이미 컬럼이 있을 수 있어 멱등 처리."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "wb_projects" in inspector.get_table_names() and not _has(inspector, "wb_projects", "mode"):
        with op.batch_alter_table("wb_projects") as batch:
            batch.add_column(sa.Column("mode", sa.String(), nullable=False, server_default="discovery"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if _has(inspector, "wb_projects", "mode"):
        with op.batch_alter_table("wb_projects") as batch:
            batch.drop_column("mode")
