const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for following a user
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
    
    // Prevent following yourself
    if (followeeId === followerId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'You cannot follow yourself' }),
      };
    }
    
    const usersTableName = process.env.USERS_TABLE;
    const followsTableName = process.env.FOLLOWS_TABLE;
    
    if (!usersTableName || !followsTableName) {
      throw new Error('Required environment variables are not set');
    }

    // Check if the followee exists
    const getFolloweeCommand = new GetCommand({
      TableName: usersTableName,
      Key: { id: followeeId }
    });
    
    const followeeResult = await ddbDocClient.send(getFolloweeCommand);

    if (!followeeResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'User to follow not found' }),
      };
    }

    // Check if already following
    const queryCommand = new QueryCommand({
      TableName: followsTableName,
      KeyConditionExpression: 'followerId = :followerId AND followeeId = :followeeId',
      ExpressionAttributeValues: {
        ':followerId': followerId,
        ':followeeId': followeeId
      }
    });
    
    const existingFollowResult = await ddbDocClient.send(queryCommand);

    if (existingFollowResult.Items && existingFollowResult.Items.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'You are already following this user' }),
      };
    }

    // Create follow relationship
    const timestamp = new Date().toISOString();
    
    const putCommand = new PutCommand({
      TableName: followsTableName,
      Item: {
        followerId,
        followeeId,
        createdAt: timestamp
      }
    });
    
    await ddbDocClient.send(putCommand);

    // Update follower count for followee
    const updateFolloweeCommand = new UpdateCommand({
      TableName: usersTableName,
      Key: { id: followeeId },
      UpdateExpression: 'SET followersCount = if_not_exists(followersCount, :zero) + :one',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1
      },
      ReturnValues: 'NONE'
    });
    
    await ddbDocClient.send(updateFolloweeCommand);

    // Update following count for follower
    const updateFollowerCommand = new UpdateCommand({
      TableName: usersTableName,
      Key: { id: followerId },
      UpdateExpression: 'SET followingCount = if_not_exists(followingCount, :zero) + :one',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1
      },
      ReturnValues: 'NONE'
    });
    
    await ddbDocClient.send(updateFollowerCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ 
        message: 'Successfully followed user',
        followerId,
        followeeId
      }),
    };
  } catch (error) {
    console.error('Error following user:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error following user',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
