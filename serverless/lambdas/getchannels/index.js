const { IvsClient, ListChannelsCommand } = require('@aws-sdk/client-ivs');

const client = new IvsClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const command = new ListChannelsCommand({});
    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(response.channels),
    };
  } catch (error) {
    console.error('Error listing IVS channels:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to list IVS channels', error: error.message }),
    };
  }
};