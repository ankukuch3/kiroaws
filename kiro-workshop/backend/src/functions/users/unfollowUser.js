const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  DeleteCommand, 
  GetCommand, 
  UpdateCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for unfollowing a user
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
    
    const usersTableName = process.env.USERS_TABLE;
    const followsTableName = process.env.FOLLOWS_TABLE;
    
    if (!usersTableName || !followsTableName) {
      throw new Error('Required environment variables are not set');
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
    
    const existingFollowResult = await ddbDocClient.send(queryCommand);

    if (!existingFollowResult.Items || existingFollowResult.Items.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'You are not following this user' }),
      };
    }

    // Delete follow relationship
    const deleteCommand = new DeleteCommand({
      TableName: followsTableName,
      Key: {
        followerId,
        followeeId
      }
    });
    
    await ddbDocClient.send(deleteCommand);

    // Update follower count for followee
    const updateFolloweeCommand = new UpdateCommand({
      TableName: usersTableName,
      Key: { id: followeeId },
      UpdateExpression: 'SET followersCount = if_not_exists(followersCount, :one) - :one',
      ExpressionAttributeValues: {
        ':one': 1
      },
      ConditionExpression: 'followersCount > :zero',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0
      },
      ReturnValues: 'NONE'
    });
    
    try {
      await ddbDocClient.send(updateFolloweeCommand);
    } catch (error) {
      // Ignore condition check failures (count already at 0)
      if (error.name !== 'ConditionalCheckFailedException') {
        throw error;
      }
    }

    // Update following count for follower
    const updateFollowerCommand = new UpdateCommand({
      TableName: usersTableName,
      Key: { id: followerId },
      UpdateExpression: 'SET followingCount = if_not_exists(followingCount, :one) - :one',
      ConditionExpression: 'followingCount > :zero',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0
      },
      ReturnValues: 'NONE'
    });
    
    try {
      await ddbDocClient.send(updateFollowerCommand);
    } catch (error) {
      // Ignore condition check failures (count already at 0)
      if (error.name !== 'ConditionalCheckFailedException') {
        throw error;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ 
        message: 'Successfully unfollowed user',
        followerId,
        followeeId
      }),
    };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error unfollowing user',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
