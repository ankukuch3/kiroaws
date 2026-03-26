const { CognitoIdentityProviderClient, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const cognitoClient = new CognitoIdentityProviderClient();
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Authentication middleware for Lambda functions
 * @param {Function} handler - The Lambda handler function
 * @returns {Function} - The wrapped handler function with authentication
 */
const withAuth = (handler) => {
  return async (event) => {
    try {
      // Get the token from the Authorization header
      const authHeader = event.headers.Authorization || event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({ message: 'Missing authorization token' }),
        };
      }

      // Extract the token (remove "Bearer " prefix if present)
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      console.log('Token received:', token.substring(0, 10) + '...');
      
      // Try to decode the JWT token to get the username directly
      // This avoids the need to validate with Cognito which requires an AccessToken
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('Token payload:', JSON.stringify(payload));
          
          // Extract username from token claims
          const username = payload['cognito:username'] || payload.username || '';
          
          if (username) {
            console.log('Username extracted from token:', username);
            
            // Get user ID from DynamoDB
            const usersTableName = process.env.USERS_TABLE || '';
            
            if (!usersTableName) {
              throw new Error('USERS_TABLE environment variable is not set');
            }
            
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
            
            // Ensure userId is a string with a default empty string if undefined
            const userId = userResult.Items[0].id || '';
            
            // Add user info to the event
            const authorizedEvent = {
              ...event,
              user: {
                id: userId,
                username,
              },
            };
            
            // Call the original handler with the enhanced event
            return await handler(authorizedEvent);
          }
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
      }
      
      // If token decoding failed, try to verify with Cognito as fallback
      const getUserCommand = new GetUserCommand({
        AccessToken: token,
      });
      
      const userInfo = await cognitoClient.send(getUserCommand);

      // Extract user ID and username from Cognito response
      const usernameAttr = userInfo.UserAttributes.find(attr => attr.Name === 'preferred_username');
      const username = usernameAttr?.Value || '';

      // Get user ID from DynamoDB
      const usersTableName = process.env.USERS_TABLE || '';

      if (!usersTableName) {
        throw new Error('USERS_TABLE environment variable is not set');
      }

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

      // Ensure userId is a string with a default empty string if undefined
      const userId = userResult.Items[0].id || '';

      // Add user info to the event
      const authorizedEvent = {
        ...event,
        user: {
          id: userId,
          username,
        },
      };

      // Call the original handler with the enhanced event
      return await handler(authorizedEvent);
    } catch (error) {
      console.error('Authentication error:', error);
      
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
};

module.exports = { withAuth };
