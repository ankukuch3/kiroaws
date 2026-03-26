const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for getting posts (feed or user's posts)
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
  try {
    const postsTableName = process.env.POSTS_TABLE;
    if (!postsTableName) {
      throw new Error('POSTS_TABLE environment variable is not set');
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 10;
    
    // Safely parse the nextToken
    let nextToken = null;
    try {
      if (queryParams.nextToken) {
        const decodedToken = decodeURIComponent(queryParams.nextToken);
        if (decodedToken) {
          nextToken = JSON.parse(decodedToken);
        }
      }
    } catch (error) {
      console.error('Error parsing nextToken:', error);
      nextToken = null;
    }
    
    const sortBy = queryParams.sortBy || 'newest';
    const userId = queryParams.userId || null;

    let posts = [];
    let lastEvaluatedKey = null;

    if (userId) {
      // Get posts for a specific user
      const queryParams = {
        TableName: postsTableName,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: sortBy !== 'newest', // false for descending (newest first)
        Limit: limit,
      };
      
      // Only add ExclusiveStartKey if nextToken exists and is valid
      if (nextToken && typeof nextToken === 'object' && Object.keys(nextToken).length > 0) {
        queryParams.ExclusiveStartKey = nextToken;
      }
      
      const queryCommand = new QueryCommand(queryParams);
      const result = await ddbDocClient.send(queryCommand);
      posts = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;
    } else {
      // Get all posts for feed
      const scanParams = {
        TableName: postsTableName,
        Limit: limit,
      };
      
      // Only add ExclusiveStartKey if nextToken exists and is valid
      if (nextToken && typeof nextToken === 'object' && Object.keys(nextToken).length > 0) {
        scanParams.ExclusiveStartKey = nextToken;
      }
      
      const scanCommand = new ScanCommand(scanParams);
      const result = await ddbDocClient.send(scanCommand);
      posts = result.Items || [];
      lastEvaluatedKey = result.LastEvaluatedKey;

      // Sort posts based on sortBy parameter
      if (sortBy === 'newest') {
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'popular') {
        posts.sort((a, b) => b.likesCount - a.likesCount);
      }
    }

    // Encode the next token
    let encodedNextToken = null;
    if (lastEvaluatedKey && Object.keys(lastEvaluatedKey).length > 0) {
      try {
        encodedNextToken = encodeURIComponent(JSON.stringify(lastEvaluatedKey));
      } catch (error) {
        console.error('Error encoding lastEvaluatedKey:', error);
        encodedNextToken = null;
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
        posts,
        nextToken: encodedNextToken,
      }),
    };
  } catch (error) {
    console.error('Error getting posts:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error getting posts',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
