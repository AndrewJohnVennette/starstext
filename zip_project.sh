#!/bin/bash

# Set the default output zip filename
OUTPUT_ZIP="project.zip"

# If an argument is provided, use it as the zip filename
if [ -n "$1" ]; then
    OUTPUT_ZIP="$1"
fi

echo "📦 Creating zip archive: $OUTPUT_ZIP..."

# Create the zip archive while excluding specified files, folders, and images
zip -r "$OUTPUT_ZIP" . \
    -x ".git/*" "*/.git/*" \
    -x ".env*" "*/.env*" \
    -x "node_modules/*" "*/node_modules/*" \
    -x "dist/*" "*/dist/*" \
    -x "uploads/*" "*/uploads/*" \
    -x "Temp/*" "*/Temp/*" \
    -x "images/*" "*/images/*" \
    -x "*.zip" "*.log" "*.dump" "*.backup" \
    -x "*.mp4" "*.mov" "*.mp3" "*.pdf" \
    -x "*.jpg" "*.jpeg" "*.png" "*.webp" "*.gif" "*.svg" "*.ico" "*.bmp" \
    > /dev/null

# Check if zip was created successfully and get its size
if [ -f "$OUTPUT_ZIP" ]; then
    # Use 'du -h' to get human-readable file size
    FILE_SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
    echo "✅ Success! Archive saved as: $OUTPUT_ZIP ($FILE_SIZE)"
else
    echo "❌ Error: Failed to create archive."
fi
