import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

declare const require: any;
declare const __dirname: string;
const path = require('path');


export class AppStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly usersTable: dynamodb.Table;
  public readonly postsTable: dynamodb.Table;
  public readonly likesTable: dynamodb.Table;
  public readonly commentsTable: dynamodb.Table;
  public readonly followsTable: dynamodb.Table;
  public readonly api: apigateway.RestApi;
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Helper function to get Lambda package path
    const getLambdaPackagePath = (functionName: string) => {
      return path.join(__dirname, '../../backend/dist/lambda-packages', `${functionName}.zip`);
    };

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        preferredUsername: { required: true, mutable: true }
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For development only
    });

    // User Pool Client
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true  // Enable ADMIN_USER_PASSWORD_AUTH flow
      },
      preventUserExistenceErrors: true
    });

    // Identity Pool
    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName
      }]
    });

    // IAM Roles for authenticated and unauthenticated users
    const authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated'
          }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    });

    // Attach role to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn
      }
    });

    // DynamoDB Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For development only
    });

    // Add GSI for username lookups
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'username-index',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // DynamoDB Posts Table
    this.postsTable = new dynamodb.Table(this, 'PostsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For development only
    });

    // Add GSI for user's posts
    this.postsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // DynamoDB Likes Table
    this.likesTable = new dynamodb.Table(this, 'LikesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For development only
    });

    // Add GSI for post's likes
    this.likesTable.addGlobalSecondaryIndex({
      indexName: 'postId-index',
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // DynamoDB Comments Table
    this.commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For development only
    });

    // Add GSI for post's comments
    this.commentsTable.addGlobalSecondaryIndex({
      indexName: 'postId-index',
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // DynamoDB Follows Table
    this.followsTable = new dynamodb.Table(this, 'FollowsTable', {
      partitionKey: { name: 'followerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'followeeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For development only
    });

    // Add GSI for followee's followers
    this.followsTable.addGlobalSecondaryIndex({
      indexName: 'followee-index',
      partitionKey: { name: 'followeeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'followerId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'MicroBloggingApi', {
      restApiName: 'Micro Blogging API',
      description: 'API for Micro Blogging application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true
      }
    });

    // Lambda function for registration
    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'register.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('register')),
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for login
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('login')),
      environment: {
        USER_POOL_ID: this.userPool.userPoolId,
        USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for getting user profile
    const getProfileFunction = new lambda.Function(this, 'GetProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'getProfile.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('getProfile')),
      environment: {
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for updating user profile
    const updateProfileFunction = new lambda.Function(this, 'UpdateProfileFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'updateProfile.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('updateProfile')),
      environment: {
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for following a user
    const followUserFunction = new lambda.Function(this, 'FollowUserFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'followUser.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('followUser')),
      environment: {
        USERS_TABLE: this.usersTable.tableName,
        FOLLOWS_TABLE: this.followsTable.tableName
      }
    });

    // Lambda function for unfollowing a user
    const unfollowUserFunction = new lambda.Function(this, 'UnfollowUserFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'unfollowUser.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('unfollowUser')),
      environment: {
        USERS_TABLE: this.usersTable.tableName,
        FOLLOWS_TABLE: this.followsTable.tableName
      }
    });

    // Lambda function for checking if following a user
    const checkFollowingFunction = new lambda.Function(this, 'CheckFollowingFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'checkFollowing.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('checkFollowing')),
      environment: {
        FOLLOWS_TABLE: this.followsTable.tableName,
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for creating posts
    const createPostFunction = new lambda.Function(this, 'CreatePostFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'createPost.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('createPost')),
      environment: {
        POSTS_TABLE: this.postsTable.tableName,
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for getting posts
    const getPostsFunction = new lambda.Function(this, 'GetPostsFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'getPosts.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('getPosts')),
      environment: {
        POSTS_TABLE: this.postsTable.tableName,
        USERS_TABLE: this.usersTable.tableName
      }
    });

    // Lambda function for liking posts
    const likePostFunction = new lambda.Function(this, 'LikePostFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'likePost.handler',
      code: lambda.Code.fromAsset(getLambdaPackagePath('likePost')),
      environment: {
        POSTS_TABLE: this.postsTable.tableName,
        LIKES_TABLE: this.likesTable.tableName,
        USERS_TABLE: this.usersTable.tableName
      }
    });



    // Grant permissions to Lambda functions
    this.userPool.grant(registerFunction, 'cognito-idp:AdminCreateUser', 'cognito-idp:AdminSetUserPassword');
    this.userPool.grant(loginFunction, 'cognito-idp:AdminInitiateAuth', 'cognito-idp:GetUser');
    this.usersTable.grantReadWriteData(registerFunction);
    this.usersTable.grantReadData(loginFunction);
    this.usersTable.grantReadData(getProfileFunction);
    this.usersTable.grantReadWriteData(updateProfileFunction);
    this.usersTable.grantReadWriteData(followUserFunction);
    this.usersTable.grantReadWriteData(unfollowUserFunction);
    this.usersTable.grantReadData(getPostsFunction);  // Add read permission for Users table
    this.usersTable.grantReadData(createPostFunction);  // Add read permission for Users table
    this.usersTable.grantReadData(likePostFunction);  // Add read permission for Users table
    this.usersTable.grantReadData(checkFollowingFunction);  // Add read permission for Users table
    this.followsTable.grantReadWriteData(followUserFunction);
    this.followsTable.grantReadWriteData(unfollowUserFunction);
    this.followsTable.grantReadData(checkFollowingFunction);
    this.postsTable.grantReadWriteData(createPostFunction);
    this.postsTable.grantReadData(getPostsFunction);
    this.postsTable.grantReadWriteData(likePostFunction);
    this.likesTable.grantReadWriteData(likePostFunction);

    // API Gateway endpoints
    const auth = this.api.root.addResource('auth');
    const register = auth.addResource('register');
    register.addMethod('POST', new apigateway.LambdaIntegration(registerFunction));
    
    const login = auth.addResource('login');
    login.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));

    const users = this.api.root.addResource('users');
    const userId = users.addResource('{userId}');
    userId.addMethod('GET', new apigateway.LambdaIntegration(getProfileFunction));
    userId.addMethod('PUT', new apigateway.LambdaIntegration(updateProfileFunction));

    // Follow/unfollow endpoints
    const follow = userId.addResource('follow');
    follow.addMethod('POST', new apigateway.LambdaIntegration(followUserFunction));
    
    const unfollow = userId.addResource('unfollow');
    unfollow.addMethod('POST', new apigateway.LambdaIntegration(unfollowUserFunction));
    
    const following = userId.addResource('following');
    following.addMethod('GET', new apigateway.LambdaIntegration(checkFollowingFunction));

    const posts = this.api.root.addResource('posts');
    posts.addMethod('GET', new apigateway.LambdaIntegration(getPostsFunction));
    posts.addMethod('POST', new apigateway.LambdaIntegration(createPostFunction));

    const userPosts = userId.addResource('posts');
    userPosts.addMethod('GET', new apigateway.LambdaIntegration(getPostsFunction));

    const postId = posts.addResource('{postId}');
    const likePost = postId.addResource('like');
    likePost.addMethod('POST', new apigateway.LambdaIntegration(likePostFunction));

    // S3 bucket for frontend hosting
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Keep all public access blocked
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      autoDeleteObjects: true, // For development only
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: 'Allow CloudFront to access the S3 bucket'
    });

    // Grant read permissions to CloudFront OAI
    this.websiteBucket.grantRead(originAccessIdentity);

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.websiteBucket, {
          originAccessIdentity: originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html', // Serve index.html as the root
      errorResponses: [
        {
          // Return index.html for 403 errors (when file not found)
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        },
        {
          // Return index.html for 404 errors (when file not found)
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        }
      ]
    });

    // Grant authenticated users access to their own user data
    this.usersTable.grantReadWriteData(authenticatedRole);
    this.postsTable.grantReadWriteData(authenticatedRole);
    this.likesTable.grantReadWriteData(authenticatedRole);
    this.commentsTable.grantReadWriteData(authenticatedRole);
    this.followsTable.grantReadWriteData(authenticatedRole);

    // Output the configuration values for frontend .env file
    // Order matches the .env file: VITE_API_URL, VITE_USER_POOL_ID, VITE_USER_POOL_CLIENT_ID, VITE_IDENTITY_POOL_ID
    new cdk.CfnOutput(this, 'ViteApiUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL'
    });

    new cdk.CfnOutput(this, 'ViteUserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'ViteUserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'ViteIdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID'
    });

  }
}
