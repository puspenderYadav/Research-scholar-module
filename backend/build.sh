#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Run database migrations
export FLASK_APP=run.py
flask db upgrade

# Initialize admin accounts automatically
python init_admin.py
