"""Update progress report to sequential workflow

Revision ID: 20251112112129
Revises: 
Create Date: 2025-11-12 11:21:29

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251112112129'
down_revision = None  # Update this with your latest migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to progress_reports table
    op.add_column('progress_reports', sa.Column('academic_year', sa.String(length=20), nullable=True))
    op.add_column('progress_reports', sa.Column('current_stage', sa.String(length=50), nullable=True))
    op.add_column('progress_reports', sa.Column('is_approved', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('progress_reports', sa.Column('approved_at', sa.DateTime(), nullable=True))
    
    # Drop old columns
    op.drop_column('progress_reports', 'final_reviewed_by')
    op.drop_column('progress_reports', 'final_reviewed_at')
    op.drop_column('progress_reports', 'final_feedback')
    
    # Update progress_report_approvals table - add new columns
    op.add_column('progress_report_approvals', sa.Column('stage', sa.String(length=50), nullable=True))
    op.add_column('progress_report_approvals', sa.Column('committee_member_id', sa.Integer(), nullable=True))
    op.add_column('progress_report_approvals', sa.Column('submitted_at', sa.DateTime(), nullable=True))
    
    # Rename reviewer_role values and update stage
    # Note: Manual data migration may be needed for existing records
    
    # Add foreign key for committee_member_id
    op.create_foreign_key(
        'fk_progress_report_approvals_committee_member',
        'progress_report_approvals', 'committee_members',
        ['committee_member_id'], ['id']
    )
    
    # Update existing progress reports
    op.execute("UPDATE progress_reports SET current_stage = 'supervisor' WHERE current_stage IS NULL")
    op.execute("UPDATE progress_reports SET is_approved = false WHERE is_approved IS NULL")
    op.execute("UPDATE progress_reports SET status = 'submitted' WHERE status = 'pending_review'")
    op.execute("UPDATE progress_reports SET status = 'with_supervisor' WHERE status = 'under_review'")
    
    # Update existing approvals with stage based on reviewer_role
    op.execute("UPDATE progress_report_approvals SET stage = 'supervisor' WHERE reviewer_role = 'supervisor' AND stage IS NULL")
    op.execute("UPDATE progress_report_approvals SET stage = 'dc_apc' WHERE reviewer_role = 'committee_member' AND stage IS NULL")


def downgrade():
    # Remove foreign key
    op.drop_constraint('fk_progress_report_approvals_committee_member', 'progress_report_approvals', type_='foreignkey')
    
    # Drop new columns from progress_report_approvals
    op.drop_column('progress_report_approvals', 'submitted_at')
    op.drop_column('progress_report_approvals', 'committee_member_id')
    op.drop_column('progress_report_approvals', 'stage')
    
    # Add back old columns to progress_reports
    op.add_column('progress_reports', sa.Column('final_feedback', sa.Text(), nullable=True))
    op.add_column('progress_reports', sa.Column('final_reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('progress_reports', sa.Column('final_reviewed_by', sa.Integer(), nullable=True))
    
    # Drop new columns from progress_reports
    op.drop_column('progress_reports', 'approved_at')
    op.drop_column('progress_reports', 'is_approved')
    op.drop_column('progress_reports', 'current_stage')
    op.drop_column('progress_reports', 'academic_year')
