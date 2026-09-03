#!/bin/sh
set -e

# If DB file doesn't exist, initialize it
if [ ! -f "./data/database.db" ]; then
    echo "Database not found. Initializing..."
    npm run build-db
else
    echo "Database already exists. Skipping init."
fi

exec "$@"