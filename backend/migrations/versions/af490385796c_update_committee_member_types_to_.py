"""Update committee member types to include APC

Revision ID: af490385796c
Revises: f74a16c8ca73
Create Date: 2025-11-10 23:36:29.498931

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'af490385796c'
down_revision = 'f74a16c8ca73'
branch_labels = None
depends_on = None


def upgrade():
    """
    Note: This migration documents the addition of 'APC' (Academic Progress Committee) 
    as a valid value for the committee_members.member_type column.
    
    The column already exists as VARCHAR and can accept 'APC' values without 
    schema changes. Existing values are 'DC' (Doctoral Committee) and 'ADC' (deprecated).
    
    No schema changes are required - this migration serves as documentation.
    """
    pass


def downgrade():
    """
    No schema changes to revert.
    """
    pass
