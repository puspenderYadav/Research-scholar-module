"""Merge ayush_b and main branches

Revision ID: 21088c7b6910
Revises: 68fe592bbc2c, af490385796c
Create Date: 2025-11-11 16:56:58.002936

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '21088c7b6910'
down_revision = ('68fe592bbc2c', 'af490385796c')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
