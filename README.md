Student Pipeline Demo
This project implements a serverless student processing pipeline using AWS CDK, Lambda, Step Functions, API Gateway, and DynamoDB.
It demonstrates conditional logic, error handling, and restore (loop-back) functionality.

Project Structure
.
├── lib/
│   └── aws-pipeline-stack.ts      # CDK stack (main infrastructure)
├── lambda/
│   ├── api-trigger/              # Lambda to trigger Step Functions via API Gateway
│   ├── service1/                 # Student validation logic
│   ├── service2/                 # GPA calculation logic
│   ├── service3/                 # Certificate generation & DynamoDB write
│   ├── result-validation/        # Restore/validation logic
│   ├── mockapi1/                 # Mock API for Service1
│   ├── mockapi2/                 # Mock API for Service2
│   └── mockapi3/                 # Mock API for Service3
├── cdk.json
├── package.json
└── README.md


How It Works:
API Gateway triggers the pipeline via the api-trigger Lambda.
The Step Functions state machine orchestrates Service1, Service2, Service3, and result validation.
Conditional logic handles validation errors, grade errors, and restore (loop-back) scenarios.
Simulation flags in the input allow you to test failure and restore scenarios.

--sampple inputs :
{
  "student_id": "S123",
  "age": 22,
  "degree": "Computer Science",
  "marks": 85
}

---Simulate Service2 Failure:


{
  "student_id": "S124",
  "age": 22,
  "degree": "Computer Science",
  "marks": 75,
  "simulateFailure": "Service2"
}

