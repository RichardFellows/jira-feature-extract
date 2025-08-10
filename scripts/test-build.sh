#!/bin/bash

# Test build script to simulate GitHub Actions workflow locally

set -e

echo "🔧 Testing local build process..."

# Check if yarn is available
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn not found. Please install Yarn Berry first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Run linting
echo "🔍 Running ESLint..."
yarn lint

# Build application
echo "🏗️  Building application..."
VITE_BASE_URL="/jira-feature-extract/" yarn build

# Check if dist directory was created
if [ -d "dist" ]; then
    echo "✅ Build successful! Dist directory created."
    echo "📁 Build artifacts:"
    ls -la dist/
    
    # Check if index.html exists
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html found in build output"
    else
        echo "❌ index.html not found in build output"
        exit 1
    fi
else
    echo "❌ Build failed! Dist directory not found."
    exit 1
fi

echo "🎉 Local build test completed successfully!"
echo "📝 Ready for GitHub Pages deployment"