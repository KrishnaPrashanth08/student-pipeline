export const handler = async(event:any) =>{
    const {age, degree}  = JSON.parse(event.body);

    const is_valid  = age >=18 && degree === "Computer Science";

    return {
        statusCode: 200,
        body : JSON.stringify({
            valid: is_valid,
            code: is_valid ? "VAlID_001" : "INVALID_001",
            message: is_valid
                ? "Validtinoo Successful"
                : "Invalid age or degree"
        })
    };
};