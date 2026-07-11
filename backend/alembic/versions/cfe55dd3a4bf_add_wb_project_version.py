"""add wb_project version

Revision ID: cfe55dd3a4bf
Revises: 6b01046820b3
Create Date: 2026-07-11 09:52:49.447627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cfe55dd3a4bf'
down_revision: Union[str, Sequence[str], None] = '6b01046820b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has(inspector, table: str, column: str) -> bool:
    if table not in inspector.get_table_names():
        return False
    return any(c["name"] == column for c in inspector.get_columns(table))


def upgrade() -> None:
    """낙관적 동시성 제어용 version 컬럼 추가. 기존 행은 1로 백필.

    이 프로젝트는 개발 시 create_all(AUTO_CREATE_ALL)로도 테이블을 만들 수 있어,
    wb_projects 가 이미 version 컬럼을 가진 경우가 있다 → 있으면 건너뛴다(멱등).
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not _has(inspector, "wb_projects", "version") and "wb_projects" in inspector.get_table_names():
        with op.batch_alter_table("wb_projects") as batch:
            batch.add_column(sa.Column("version", sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if _has(inspector, "wb_projects", "version"):
        with op.batch_alter_table("wb_projects") as batch:
            batch.drop_column("version")
