#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Run database migrations
flask db upgrade

# Seed database with initial data (only if needed)
# Uncomment the line below if you want to seed on first deployment
# flask seed-db
