const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for creating a new post
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
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

    const { content } = JSON.parse(event.body);
    
    if (!content || content.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Post content cannot be empty' }),
      };
    }
    
    // Limit post content length
    const MAX_CONTENT_LENGTH = 280;
    if (content.length > MAX_CONTENT_LENGTH) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: `Post content cannot exceed ${MAX_CONTENT_LENGTH} characters` }),
      };
    }
    
    const postsTableName = process.env.POSTS_TABLE;
    if (!postsTableName) {
      throw new Error('POSTS_TABLE environment variable is not set');
    }

    // Create post
    const postId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const post = {
      id: postId,
      userId: event.user.id,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
      likesCount: 0,
      commentsCount: 0,
    };

    const putCommand = new PutCommand({
      TableName: postsTableName,
      Item: post,
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
        message: 'Post created successfully',
        post,
      }),
    };
  } catch (error) {
    console.error('Error creating post:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error creating post',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
