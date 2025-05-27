import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import axios from 'axios';

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
    try {
        // Call mock API    
        const certRes = await axios.post(
            process.env.MOCK_API3_URL!, 
            { student_id: event.student_id }
        );
        const certData = certRes.data;

        // Prepare database item
        const dbItem = {
            student_id: event.student_id,
            age: event.age,
            degree: event.degree,
            gpa: event.gpa,
            grade: event.letter_grade,
            certificate_url: certData.url,
            expiry: certData.expiry,
            processed_at: new Date().toISOString()
        };

        // Save to DynamoDB using v3 SDK
        await docClient.send(new PutCommand({
            TableName: process.env.TABLE_NAME!,
            Item: dbItem
        }));

       return {
        ...event,
        certificate_url: certRes.data.url,
        expiry: certRes.data.expiry,
        processed_at: new Date().toISOString()
    };

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Processing failed" })
        };
    }
};
