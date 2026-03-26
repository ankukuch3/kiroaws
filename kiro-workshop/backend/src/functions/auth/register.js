const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// Initialize clients
const cognitoClient = new CognitoIdentityProviderClient();
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for user registration
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const { username, email, password, displayName } = JSON.parse(event.body);

    // Register user in Cognito
    const userPoolId = process.env.USER_POOL_ID;
    if (!userPoolId) {
      throw new Error('USER_POOL_ID environment variable is not set');
    }

    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'preferred_username', Value: username },
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
    });
    
    await cognitoClient.send(createUserCommand);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    });
    
    await cognitoClient.send(setPasswordCommand);

    // Create user in DynamoDB
    const userId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const user = {
      id: userId,
      username,
      email,
      displayName,
      createdAt: timestamp,
      updatedAt: timestamp,
      followersCount: 0,
      followingCount: 0,
    };

    const usersTableName = process.env.USERS_TABLE;
    if (!usersTableName) {
      throw new Error('USERS_TABLE environment variable is not set');
    }

    const putCommand = new PutCommand({
      TableName: usersTableName,
      Item: user,
    });
    
    await ddbDocClient.send(putCommand);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        },
      }),
    };
  } catch (error) {
    console.error('Error registering user:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error registering user',
        error: error.message || 'Unknown error',
      }),
    };
  }
};
