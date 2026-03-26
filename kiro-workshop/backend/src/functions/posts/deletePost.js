const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  };

  try {
    const postId = event.pathParameters?.postId;
    if (!postId) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Missing postId' }) };
    }

    const postsTableName = process.env.POSTS_TABLE;
    if (!postsTableName) throw new Error('POSTS_TABLE environment variable is not set');

    // Fetch the post to verify ownership
    const { Item: post } = await ddbDocClient.send(new GetCommand({
      TableName: postsTableName,
      Key: { id: postId },
    }));

    if (!post) {
      return { statusCode: 404, headers, body: JSON.stringify({ message: 'Post not found' }) };
    }

    if (post.userId !== event.user.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ message: 'Forbidden' }) };
    }

    await ddbDocClient.send(new DeleteCommand({
      TableName: postsTableName,
      Key: { id: postId },
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Post deleted successfully' }) };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Error deleting post', error: error.message }) };
  }
};

exports.handler = withAuth(handler);
