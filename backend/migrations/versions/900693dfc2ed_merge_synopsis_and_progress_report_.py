"""merge synopsis and progress report workflow updates

Revision ID: 900693dfc2ed
Revises: 20251112110646, 20251112112129, 21088c7b6910
Create Date: 2025-11-12 11:30:17.181487

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '900693dfc2ed'
down_revision = ('20251112110646', '20251112112129', '21088c7b6910')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
