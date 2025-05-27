# Student Pipeline Demo

This project implements a serverless student processing pipeline using **AWS CDK**, **Lambda**, **Step Functions**, **API Gateway**, and **DynamoDB**.  
It demonstrates conditional logic, error handling, and restore (loop-back) functionality.

---

## Project Structure

:(https://github.com/user-attachments/assets/b4c24622-e231-423c-b940-d911e3c149e9)


---

---

## How It Works

- **API Gateway** triggers the pipeline via the `api-trigger` Lambda.
- The **Step Functions state machine** orchestrates Service1, Service2, Service3, and result validation.
- **Conditional logic** handles validation errors, grade errors, and restore (loop-back) scenarios.
- **Simulation flags** in the input allow you to test failure and restore scenarios.

---

## Sample Inputs

### Normal Flow

{
"student_id": "S123",
"age": 22,
"degree": "Computer Science",
"marks": 85
}


### Simulate Restore (Loop-back)

{
"student_id": "S125",
"age": 22,
"degree": "Computer Science",
"marks": 60,
"simulateRestore": true
}


