#!/bin/bash

# Script to prepare Lambda deployment packages with dependencies
# This script creates individual deployment packages for each Lambda function
# with the required dependencies included

set -e

echo "Preparing Lambda deployment packages..."

# Create a temporary directory for the packages
TEMP_DIR="./dist/lambda-packages"
mkdir -p $TEMP_DIR

# Function to prepare a package for a specific Lambda function
prepare_package() {
    local function_path=$1
    local function_name=$(basename $function_path .js)
    local function_dir=$(dirname $function_path)
    local package_dir="$TEMP_DIR/$function_name"
    
    echo "Preparing package for $function_name..."
    
    # Create package directory
    mkdir -p $package_dir
    
    # Copy the function file
    cp $function_path $package_dir/
    
    # Copy the middleware file if it's an authenticated function
    if grep -q "withAuth" $function_path; then
        # Copy the middleware.js file directly to the package root
        cp ./src/common/middleware.js $package_dir/
        
        # Update the import path in the function file
        # This sed command replaces '../../common/middleware' with './middleware'
        sed -i '' "s|require('../../common/middleware')|require('./middleware')|g" $package_dir/$(basename $function_path)
    fi
    
    # Create a package.json file
    cat > $package_dir/package.json << EOF
{
  "name": "$function_name",
  "version": "1.0.0",
  "description": "Lambda function for $function_name",
  "main": "$(basename $function_path)",
  "dependencies": {
    "@aws-sdk/client-cognito-identity-provider": "^3.496.0",
    "@aws-sdk/client-dynamodb": "^3.496.0",
    "@aws-sdk/lib-dynamodb": "^3.496.0",
    "uuid": "^9.0.0"
  }
}
EOF
    
    # Install dependencies
    cd $package_dir
    npm install --production
    cd -
    
    # Create a zip file
    cd $package_dir
    zip -r ../$function_name.zip .
    cd -
    
    echo "Package for $function_name prepared successfully"
}

# Prepare packages for auth functions
for func in ./src/functions/auth/*.js; do
    prepare_package $func
done

# Prepare packages for user functions
for func in ./src/functions/users/*.js; do
    prepare_package $func
done

# Prepare packages for post functions
for func in ./src/functions/posts/*.js; do
    prepare_package $func
done

echo "All Lambda packages prepared successfully in $TEMP_DIR"
