#!/bin/bash
# Quick save script for GameBird project

echo "🔄 Saving current project state..."

# Get current date/time
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to save - working tree is clean"
    exit 0
fi

# If no message provided, use default
MESSAGE="${1:-Update project - $DATE}"

# Save to git
git add -A
git commit -m "$MESSAGE"
git push origin main

echo "✅ Project saved successfully!"
echo "📝 Commit message: $MESSAGE"
