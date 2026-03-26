#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="${SCRIPT_DIR}/backend"
INFRASTRUCTURE_DIR="${SCRIPT_DIR}/infrastructure"

# Stack name (can be overridden via environment variable)
STACK_NAME="${STACK_NAME:-AppStack}"

echo "🚀 Starting backend deployment..."
echo "📦 Stack name: ${STACK_NAME}"

# Navigate to the backend directory
cd "${BACKEND_DIR}"

# Install dependencies if needed
echo "📦 Installing backend dependencies..."
npm install

# Make the prepare-lambda-packages.sh script executable
chmod +x ./scripts/prepare-lambda-packages.sh

# Prepare Lambda packages with dependencies
echo "📦 Preparing Lambda packages with dependencies..."
./scripts/prepare-lambda-packages.sh

# Build the backend
echo "🔨 Building backend..."
npm run build

# Navigate to infrastructure directory
cd "${INFRASTRUCTURE_DIR}"

# Install dependencies if needed
echo "📦 Installing infrastructure dependencies..."
npm install

# Make sure @types/node is installed
echo "📦 Ensuring @types/node is installed..."
npm install --save-dev @types/node

# Build the infrastructure code
echo "🔨 Building infrastructure code..."
npm run build

# Deploy backend infrastructure using CDK
echo "🏗️ Deploying backend infrastructure..."

# Bootstrap CDK environment (idempotent - safe to run multiple times)
echo "🔧 Ensuring CDK environment is bootstrapped..."
cdk bootstrap

cdk deploy ${STACK_NAME} --require-approval never

echo "✅ Backend deployment completed successfully!"
