import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class AwsPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create DynamoDB Table for Results
    const resultsTable = new dynamodb.Table(this, 'ResultsTable', {
      partitionKey: { name: 'student_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // 2. Create Mock Third-Party APIs
    const mockApi1 = this.createMockApi('MockApi1', 'mockapi1');
    const mockApi2 = this.createMockApi('MockApi2', 'mockapi2');
    const mockApi3 = this.createMockApi('MockApi3', 'mockapi3');

    // 3. Create Service Lambdas
    const service1 = this.createServiceLambda('Service1', 'service1', {
      MOCK_API1_URL: mockApi1.url
    });

    const service2 = this.createServiceLambda('Service2', 'service2', {
      MOCK_API2_URL: mockApi2.url
    });

    const service3 = this.createServiceLambda('Service3', 'service3', {
      MOCK_API3_URL: mockApi3.url,
      TABLE_NAME: resultsTable.tableName
    });
    resultsTable.grantWriteData(service3);

    const resultValidation = this.createServiceLambda('ResultValidation', 'result-validation', {});


    // 4. Create Step Functions State Machine with Conditional Logic
    const service1Task = new tasks.LambdaInvoke(this, 'Service1Task', {
      lambdaFunction: service1,
      outputPath: '$.Payload'
    });

    // Add retry using addRetry() method
    service1Task.addRetry({
      errors: ['States.ALL'],
      interval: cdk.Duration.seconds(2),  // Use 'interval' with Duration
      maxAttempts: 2,
      backoffRate: 2.0
    });

    const service2Task = new tasks.LambdaInvoke(this, 'Service2Task', {
      lambdaFunction: service2,
      outputPath: '$.Payload'
    });

    // Add retry using addRetry() method
   service2Task.addRetry({
    errors: ['States.ALL'],
    interval: cdk.Duration.seconds(2),  // Use 'interval' with Duration
    maxAttempts: 3,
    backoffRate: 2.0
  });

    const service3Task = new tasks.LambdaInvoke(this, 'Service3Task', {
      lambdaFunction: service3,
      outputPath: '$.Payload'
    });

    // Add retry using addRetry() method
   service3Task.addRetry({
    errors: ['States.ALL'],
    interval: cdk.Duration.seconds(2),  // Use 'interval' with Duration
    maxAttempts: 2,
    backoffRate: 1.5
  });

    // Create Success and Failure States
    const successState = new stepfunctions.Pass(this, 'ProcessingComplete', {
      result: stepfunctions.Result.fromObject({
        status: "COMPLETED",
        message: "Pipeline execution completed successfully",
        timestamp: stepfunctions.JsonPath.stringAt('$$.State.EnteredTime')
      }),
      resultPath: '$.completion'
    });

    const validationErrorState = new stepfunctions.Pass(this, 'ValidationError', {
      result: stepfunctions.Result.fromObject({
        status: "REJECTED",
        error: "INVALID_STUDENT",
        message: "Student validation failed - invalid age or degree",
        timestamp: stepfunctions.JsonPath.stringAt('$$.State.EnteredTime')
      }),
     resultPath: '$.error'
    }).next(successState);

    const gradeErrorState = new stepfunctions.Pass(this, 'GradeError', {
      result: stepfunctions.Result.fromObject({
        status: "REJECTED", 
        error: "INSUFFICIENT_GRADE",
        message: "Student grade below minimum requirements",
        timestamp: stepfunctions.JsonPath.stringAt('$$.State.EnteredTime')
      }),
      resultPath: '$.error'
    }).next(successState);

    const certificateFailedState = new stepfunctions.Fail(this, 'CertificateFailed', {
      error: 'CertificateGenerationFailed',
      cause: 'Failed to generate certificate after retries'
    });

   const validationTask = new tasks.LambdaInvoke(this, 'ValidateResults', {
  lambdaFunction: resultValidation,
  outputPath: '$.Payload'
});

// Add restore choice that loops back to Service2
const restoreChoice = new stepfunctions.Choice(this, 'CheckIfRestoreNeeded')
  .when(
    stepfunctions.Condition.and(
      stepfunctions.Condition.booleanEquals('$.needsRestore', true),
      stepfunctions.Condition.numberLessThan('$.restoreCount', 1)
    ),
    // This creates the loop back arrow to Service2
    new stepfunctions.Pass(this, 'RestoreToService2', {
      parameters: {
        "student_id.$": "$.student_id",
        "age.$": "$.age",
        "degree.$": "$.degree",
        "marks.$": "$.marks",
        "is_valid": true,
         "restoreCount.$": "States.MathAdd($.restoreCount, 1)"
      }
    }).next(service2Task) // Loop back to Service2
  )
  .otherwise(successState);

// Update gradeChoice to include validation and restore
const gradeChoice = new stepfunctions.Choice(this, 'CheckGradeRequirement')
  .when(
    stepfunctions.Condition.booleanEquals('$.grade_check_passed', false),
    gradeErrorState
  )
  .otherwise(service3Task
    .next(validationTask        
      .next(restoreChoice)));

    // Create Student Validation Choice State  
    const validationChoice = new stepfunctions.Choice(this, 'CheckStudentValid')
      .when(
        stepfunctions.Condition.booleanEquals('$.is_valid', false),
        validationErrorState  
      )
      .otherwise(service2Task.next(gradeChoice));

    // Define the complete workflow with branching
    const definition = service1Task.next(validationChoice);

    const stateMachine = new stepfunctions.StateMachine(this, 'PipelineStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(10),
      tracingEnabled: true
    });

    // 5. Create API Gateway Trigger
    const apiTriggerLambda = new NodejsFunction(this, 'APITrigger', {
      entry: 'lambda/api-trigger/index.ts',
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn
      }
    });

    // Grant permission to start Step Functions executions
    stateMachine.grantStartExecution(apiTriggerLambda);

    const api = new apigateway.LambdaRestApi(this, 'PipelineAPI', {
      handler: apiTriggerLambda,
      proxy: false
    });

    api.root.addMethod('POST');
  }

  private createMockApi(id: string, lambdaFolder: string): apigateway.LambdaRestApi {
    const mockLambda = new NodejsFunction(this, id + 'Lambda', {
      entry: `lambda/${lambdaFolder}/index.ts`,
      bundling: {
        externalModules: ['@aws-sdk'],
      }
    });

    return new apigateway.LambdaRestApi(this, id + 'Gateway', {
      handler: mockLambda,
      proxy: true
    });
  }

  private createServiceLambda(id: string, lambdaFolder: string, environment: { [key: string]: string }): NodejsFunction {
    return new NodejsFunction(this, id, {
      entry: `lambda/${lambdaFolder}/index.ts`,
      environment,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      tracing: lambda.Tracing.ACTIVE
    });
  }
}
