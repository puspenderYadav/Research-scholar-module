"""Add progress report approval workflow

Revision ID: f74a16c8ca73
Revises: c9a2d7e4b3f1
Create Date: 2025-11-10 23:08:36.903730

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f74a16c8ca73'
down_revision = 'c9a2d7e4b3f1'
branch_labels = None
depends_on = None


def upgrade():
    # Create progress_report_approvals table
    op.create_table(
        'progress_report_approvals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('progress_report_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_role', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['progress_report_id'], ['progress_reports.id'], ),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Add new columns for final review to progress_reports
    op.add_column('progress_reports', sa.Column('final_reviewed_by', sa.Integer(), nullable=True))
    op.add_column('progress_reports', sa.Column('final_reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('progress_reports', sa.Column('final_feedback', sa.Text(), nullable=True))
    
    # Add foreign key for final_reviewed_by
    op.create_foreign_key('fk_progress_reports_final_reviewer', 'progress_reports', 'users', ['final_reviewed_by'], ['id'])


def downgrade():
    # Drop foreign key
    op.drop_constraint('fk_progress_reports_final_reviewer', 'progress_reports', type_='foreignkey')
    
    # Drop new columns from progress_reports
    op.drop_column('progress_reports', 'final_feedback')
    op.drop_column('progress_reports', 'final_reviewed_at')
    op.drop_column('progress_reports', 'final_reviewed_by')
    
    # Drop progress_report_approvals table
    op.drop_table('progress_report_approvals')
