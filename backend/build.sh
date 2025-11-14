#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Run database migrations
flask db upgrade

# Initialize admin accounts automatically
flask init-admin-accounts
