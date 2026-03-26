#!/bin/bash

# Script to deploy Lambda functions with dependencies

# Exit on error
set -e

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy all JavaScript files to dist
echo "Copying JavaScript files to dist..."
find src -name "*.js" -exec cp --parents {} dist \;

# Create a temporary directory for each Lambda function
echo "Creating deployment packages for each Lambda function..."

# Auth functions
mkdir -p dist/functions/auth/register_deploy
cp dist/functions/auth/register.js dist/functions/auth/register_deploy/
cp dist/common/middleware.js dist/functions/auth/register_deploy/
cd dist/functions/auth/register_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
zip -r ../../../../deploy_register.zip .
cd ../../../../

mkdir -p dist/functions/auth/login_deploy
cp dist/functions/auth/login.js dist/functions/auth/login_deploy/
cp dist/common/middleware.js dist/functions/auth/login_deploy/
cd dist/functions/auth/login_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_login.zip .
cd ../../../../

# User functions
mkdir -p dist/functions/users/getProfile_deploy
cp dist/functions/users/getProfile.js dist/functions/users/getProfile_deploy/
cp dist/common/middleware.js dist/functions/users/getProfile_deploy/
cd dist/functions/users/getProfile_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_getProfile.zip .
cd ../../../../

mkdir -p dist/functions/users/updateProfile_deploy
cp dist/functions/users/updateProfile.js dist/functions/users/updateProfile_deploy/
cp dist/common/middleware.js dist/functions/users/updateProfile_deploy/
cd dist/functions/users/updateProfile_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_updateProfile.zip .
cd ../../../../

mkdir -p dist/functions/users/followUser_deploy
cp dist/functions/users/followUser.js dist/functions/users/followUser_deploy/
cp dist/common/middleware.js dist/functions/users/followUser_deploy/
cd dist/functions/users/followUser_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_followUser.zip .
cd ../../../../

mkdir -p dist/functions/users/unfollowUser_deploy
cp dist/functions/users/unfollowUser.js dist/functions/users/unfollowUser_deploy/
cp dist/common/middleware.js dist/functions/users/unfollowUser_deploy/
cd dist/functions/users/unfollowUser_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_unfollowUser.zip .
cd ../../../../

mkdir -p dist/functions/users/checkFollowing_deploy
cp dist/functions/users/checkFollowing.js dist/functions/users/checkFollowing_deploy/
cp dist/common/middleware.js dist/functions/users/checkFollowing_deploy/
cd dist/functions/users/checkFollowing_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_checkFollowing.zip .
cd ../../../../

# Post functions
mkdir -p dist/functions/posts/createPost_deploy
cp dist/functions/posts/createPost.js dist/functions/posts/createPost_deploy/
cp dist/common/middleware.js dist/functions/posts/createPost_deploy/
cd dist/functions/posts/createPost_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
zip -r ../../../../deploy_createPost.zip .
cd ../../../../

mkdir -p dist/functions/posts/getPosts_deploy
cp dist/functions/posts/getPosts.js dist/functions/posts/getPosts_deploy/
cp dist/common/middleware.js dist/functions/posts/getPosts_deploy/
cd dist/functions/posts/getPosts_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_getPosts.zip .
cd ../../../../

mkdir -p dist/functions/posts/likePost_deploy
cp dist/functions/posts/likePost.js dist/functions/posts/likePost_deploy/
cp dist/common/middleware.js dist/functions/posts/likePost_deploy/
cd dist/functions/posts/likePost_deploy
npm init -y
npm install --production @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r ../../../../deploy_likePost.zip .
cd ../../../../

echo "Deployment packages created successfully!"
echo "You can now update your Lambda functions with these zip files."
