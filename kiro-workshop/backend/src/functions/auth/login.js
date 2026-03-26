const { 
  CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  GetUserCommand 
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const cognitoClient = new CognitoIdentityProviderClient();
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for user login
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

    const { email, password } = JSON.parse(event.body);

    // Get Cognito configuration from environment variables
    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT_ID;

    if (!userPoolId || !clientId) {
      throw new Error('Missing required environment variables');
    }

    // Authenticate user with Cognito
    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });
    
    const authResponse = await cognitoClient.send(authCommand);

    if (!authResponse.AuthenticationResult) {
      throw new Error('Authentication failed');
    }

    const { AccessToken, IdToken, RefreshToken } = authResponse.AuthenticationResult;

    // Get user details from Cognito
    const getUserCommand = new GetUserCommand({
      AccessToken: AccessToken,
    });
    
    const userResponse = await cognitoClient.send(getUserCommand);

    // Find username attribute
    const usernameAttr = userResponse.UserAttributes.find(attr => attr.Name === 'preferred_username');
    const username = usernameAttr ? usernameAttr.Value : '';

    // Get user from DynamoDB
    const usersTableName = process.env.USERS_TABLE;
    if (!usersTableName) {
      throw new Error('USERS_TABLE environment variable is not set');
    }

    // Query by username using the GSI
    const queryCommand = new QueryCommand({
      TableName: usersTableName,
      IndexName: 'username-index',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
    });
    
    const userResult = await ddbDocClient.send(queryCommand);

    if (!userResult.Items || userResult.Items.length === 0) {
      throw new Error('User not found in database');
    }

    const user = userResult.Items[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Login successful',
        token: IdToken,
        refreshToken: RefreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        },
      }),
    };
  } catch (error) {
    console.error('Error during login:', error);
    
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Authentication failed',
        error: error.message || 'Unknown error',
      }),
    };
  }
};
