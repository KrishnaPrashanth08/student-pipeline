import axios from "axios"
// calling the moock api 1 to validate the age and degree fooorm the initial api gateway call
export const handler = async (event: any) =>{
    try{
        const validationRes = await axios.post(process.env.MOCK_API1_URL!,{
        age: event.age,
        degree: event.degree
        });
        return {
            ...event,
            is_valid: validationRes.data.valid,
            validation_code: validationRes.data.code,
            validation_message: validationRes.data.message

        };
    }catch(error){
        console.error("Validation failed:" ,error);
        throw error;
    }
   
};