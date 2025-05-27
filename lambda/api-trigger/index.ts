import { APIGatewayProxyHandler } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const sfn = new SFNClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const input = JSON.parse(event.body || '{}');
    input.restoreCount = input.restoreCount || 0;
    
    const command = new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN!,
      input: JSON.stringify(input)
    });

    const result = await sfn.send(command);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        executionArn: result.executionArn
      })
    };
  } catch (error) {
    console.error('Trigger error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to start pipeline' })
    };
  }
};
