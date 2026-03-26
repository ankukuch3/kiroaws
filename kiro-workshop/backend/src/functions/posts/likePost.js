const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for liking a post
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
  try {
    // Get post ID from path parameter
    const postId = event.pathParameters?.postId;
    const userId = event.user.id;
    
    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Missing post ID' }),
      };
    }
    
    const postsTableName = process.env.POSTS_TABLE;
    const likesTableName = process.env.LIKES_TABLE;
    
    if (!postsTableName || !likesTableName) {
      throw new Error('Required environment variables are not set');
    }

    // Check if the post exists
    const getPostCommand = new GetCommand({
      TableName: postsTableName,
      Key: { id: postId }
    });
    
    const postResult = await ddbDocClient.send(getPostCommand);

    if (!postResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Post not found' }),
      };
    }

    // Check if already liked
    const queryCommand = new QueryCommand({
      TableName: likesTableName,
      KeyConditionExpression: 'userId = :userId AND postId = :postId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':postId': postId
      }
    });
    
    const existingLikeResult = await ddbDocClient.send(queryCommand);

    if (existingLikeResult.Items && existingLikeResult.Items.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'You have already liked this post' }),
      };
    }

    // Create like record
    const timestamp = new Date().toISOString();
    
    const putCommand = new PutCommand({
      TableName: likesTableName,
      Item: {
        userId,
        postId,
        createdAt: timestamp
      }
    });
    
    await ddbDocClient.send(putCommand);

    // Update like count for the post
    const updateCommand = new UpdateCommand({
      TableName: postsTableName,
      Key: { id: postId },
      UpdateExpression: 'SET likesCount = if_not_exists(likesCount, :zero) + :one',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1
      },
      ReturnValues: 'ALL_NEW'
    });
    
    const updatedPost = await ddbDocClient.send(updateCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ 
        message: 'Successfully liked post',
        post: updatedPost.Attributes
      }),
    };
  } catch (error) {
    console.error('Error liking post:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error liking post',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
