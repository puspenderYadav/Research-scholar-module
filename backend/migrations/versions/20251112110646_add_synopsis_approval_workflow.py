"""Add synopsis approval workflow

Revision ID: 20251112110646
Revises: 
Create Date: 2025-11-12 11:06:46

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251112110646'
down_revision = None  # Update this with your latest migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to synopsis table
    op.add_column('synopsis', sa.Column('current_stage', sa.String(length=50), nullable=True))
    op.add_column('synopsis', sa.Column('is_approved', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('synopsis', sa.Column('approved_at', sa.DateTime(), nullable=True))
    
    # Drop old columns
    op.drop_column('synopsis', 'reviewed_by')
    op.drop_column('synopsis', 'reviewed_at')
    op.drop_column('synopsis', 'feedback')
    
    # Create synopsis_approvals table
    op.create_table('synopsis_approvals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('synopsis_id', sa.Integer(), nullable=False),
        sa.Column('stage', sa.String(length=50), nullable=False),
        sa.Column('approver_id', sa.Integer(), nullable=True),
        sa.Column('approver_role', sa.String(length=50), nullable=True),
        sa.Column('committee_member_id', sa.Integer(), nullable=True),
        sa.Column('decision', sa.String(length=50), nullable=True, server_default='pending'),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['synopsis_id'], ['synopsis.id'], ),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['committee_member_id'], ['committee_members.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Update existing synopsis records
    op.execute("UPDATE synopsis SET current_stage = 'supervisor' WHERE current_stage IS NULL")
    op.execute("UPDATE synopsis SET is_approved = false WHERE is_approved IS NULL")


def downgrade():
    # Drop synopsis_approvals table
    op.drop_table('synopsis_approvals')
    
    # Add back old columns
    op.add_column('synopsis', sa.Column('feedback', sa.Text(), nullable=True))
    op.add_column('synopsis', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('synopsis', sa.Column('reviewed_by', sa.Integer(), nullable=True))
    
    # Drop new columns
    op.drop_column('synopsis', 'approved_at')
    op.drop_column('synopsis', 'is_approved')
    op.drop_column('synopsis', 'current_stage')
