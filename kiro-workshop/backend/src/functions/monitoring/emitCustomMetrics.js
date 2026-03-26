const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

/**
 * Lambda function to emit custom metrics to CloudWatch
 * This can be used to track business-level metrics that aren't automatically captured
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const { metricName, value, dimensions, unit = 'Count', namespace = 'MicroBloggingApp' } = event;
    
    if (!metricName || value === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameters: metricName and value' }),
      };
    }
    
    const params = {
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: dimensions || [],
          Timestamp: new Date(),
          Unit: unit,
          Value: value,
        },
      ],
      Namespace: namespace,
    };
    
    await cloudwatch.putMetricData(params).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Metric published successfully' }),
    };
  } catch (error) {
    console.error('Error publishing metric:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error publishing metric', error: error.message }),
    };
  }
};
