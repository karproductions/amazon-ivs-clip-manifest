const { IvsClient, ListChannelsCommand } = require('@aws-sdk/client-ivs');

const client = new IvsClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const command = new ListChannelsCommand({});
    const response = await client.send(command);

    const simplifiedChannels = response.channels.map(channel => ({
      id: channel.arn.split('/').pop(),
      name: channel.name
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify(simplifiedChannels),
    };
  } catch (error) {
    console.error('Error listing IVS channels:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ message: 'Failed to list IVS channels', error: error.message }),
    };
  }
};