#!/bin/bash

# Choreo Deployment Preparation Script
# This script prepares your Milk Dairy Management System for Choreo deployment

echo "🚀 Preparing Milk Dairy Management System for Choreo Deployment"
echo "=============================================================="

# Check if we're in the right directory
if [ ! -f "server/package.json" ] || [ ! -f "client/package.json" ]; then
    echo "❌ Error: Please run this script from the root directory of your project"
    exit 1
fi

echo "✅ Project structure verified"

# Check if Git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Milk Dairy Management System"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore file..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF
    echo "✅ .gitignore file created"
fi

# Verify all required files exist
echo "🔍 Verifying deployment files..."

required_files=(
    "server/.choreo/component.yaml"
    "server/.choreo/endpoints.yaml"
    "server/Dockerfile"
    "client/.choreo/component.yaml"
    "client/.choreo/endpoints.yaml"
    "client/Dockerfile"
    "client/nginx.conf"
    ".choreoignore"
    "DEPLOYMENT.md"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required deployment files are present"
else
    echo "❌ Missing required files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo "Please ensure all files are created before deployment"
    exit 1
fi

# Check package.json files
echo "📦 Checking package.json files..."

if [ -f "server/package.json" ]; then
    echo "✅ Server package.json found"
else
    echo "❌ Server package.json not found"
    exit 1
fi

if [ -f "client/package.json" ]; then
    echo "✅ Client package.json found"
else
    echo "❌ Client package.json not found"
    exit 1
fi

# Test Docker builds locally (optional)
echo "🐳 Testing Docker builds (optional - press Ctrl+C to skip)..."
echo "Building server Docker image..."
cd server
if docker build -t milk-dairy-backend . > /dev/null 2>&1; then
    echo "✅ Server Docker build successful"
    docker rmi milk-dairy-backend > /dev/null 2>&1
else
    echo "⚠️  Server Docker build failed (this might be okay if Docker isn't installed)"
fi
cd ..

echo "Building client Docker image..."
cd client
if docker build -t milk-dairy-frontend . > /dev/null 2>&1; then
    echo "✅ Client Docker build successful"
    docker rmi milk-dairy-frontend > /dev/null 2>&1
else
    echo "⚠️  Client Docker build failed (this might be okay if Docker isn't installed)"
fi
cd ..

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Choreo deployment'"
echo "   git remote add origin https://github.com/yourusername/your-repo.git"
echo "   git push -u origin main"
echo ""
echo "2. Follow the detailed deployment guide in DEPLOYMENT.md"
echo ""
echo "3. Key URLs after deployment:"
echo "   - Backend API: https://your-backend-url/api"
echo "   - API Documentation: https://your-backend-url/api-docs"
echo "   - Health Check: https://your-backend-url/api/health"
echo "   - Frontend App: https://your-frontend-url"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo "🆘 For support, visit: https://wso2.com/choreo/docs/"