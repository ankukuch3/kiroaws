const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for checking if the current user follows another user
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
  try {
    // Get followee ID from path parameter
    const followeeId = event.pathParameters?.userId;
    const followerId = event.user.id;
    
    if (!followeeId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Missing user ID' }),
      };
    }
    
    const followsTableName = process.env.FOLLOWS_TABLE;
    
    if (!followsTableName) {
      throw new Error('FOLLOWS_TABLE environment variable is not set');
    }

    // Check if the follow relationship exists
    const queryCommand = new QueryCommand({
      TableName: followsTableName,
      KeyConditionExpression: 'followerId = :followerId AND followeeId = :followeeId',
      ExpressionAttributeValues: {
        ':followerId': followerId,
        ':followeeId': followeeId
      }
    });
    
    const result = await ddbDocClient.send(queryCommand);
    const following = result.Items && result.Items.length > 0;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ following }),
    };
  } catch (error) {
    console.error('Error checking follow status:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error checking follow status',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
