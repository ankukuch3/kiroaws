const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for getting a user profile
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
  try {
    // Get user ID from path parameter or use authenticated user's ID
    const userId = event.pathParameters?.userId || event.user.id;
    
    const usersTableName = process.env.USERS_TABLE;
    if (!usersTableName) {
      throw new Error('USERS_TABLE environment variable is not set');
    }

    // Get user from DynamoDB
    const getCommand = new GetCommand({
      TableName: usersTableName,
      Key: { id: userId }
    });
    
    const result = await ddbDocClient.send(getCommand);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    // Remove sensitive information if present
    const { password, ...user } = result.Item;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error getting user profile',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
