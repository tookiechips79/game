#!/bin/bash

# Set DATABASE_URL from .env file
export DATABASE_URL="postgresql://gamebird_user:jSG5pPI22nTg72mK5P17h8xnsjjscrxG@dpg-d4f4k74hg0os738nlk8g-a.oregon-postgres.render.com/gamebird_ckcf"

echo "✅ DATABASE_URL is set"
echo "🚀 Starting server..."
echo ""

# Start the server
node server.js

