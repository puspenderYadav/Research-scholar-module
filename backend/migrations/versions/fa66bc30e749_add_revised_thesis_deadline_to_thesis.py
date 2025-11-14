"""add_revised_thesis_deadline_to_thesis

Revision ID: fa66bc30e749
Revises: b966e6ff82c4
Create Date: 2025-11-14 10:45:54.854311

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fa66bc30e749'
down_revision = 'b966e6ff82c4'
branch_labels = None
depends_on = None


def upgrade():
    # Add revised_thesis_deadline column
    op.add_column('thesis_submissions', sa.Column('revised_thesis_deadline', sa.DateTime(), nullable=True))


def downgrade():
    # Remove revised_thesis_deadline column
    op.drop_column('thesis_submissions', 'revised_thesis_deadline')
