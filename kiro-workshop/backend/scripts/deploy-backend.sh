#!/bin/bash

# Master script to deploy the backend
# This script prepares the Lambda packages and deploys the CDK stack

set -e

echo "Starting backend deployment..."

# Make sure the scripts are executable
chmod +x ./scripts/prepare-lambda-packages.sh

# Prepare Lambda packages
echo "Preparing Lambda packages..."
./scripts/prepare-lambda-packages.sh

# Update the CDK stack to use the prepared packages
echo "Updating CDK stack..."
cd ../infrastructure

# Build the CDK project
npm run build

# Deploy the CDK stack
echo "Deploying CDK stack..."
cdk deploy --require-approval never

echo "Backend deployment completed successfully!"
