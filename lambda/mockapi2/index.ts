export const handler = async (event:any) =>{
    const {marks } = JSON.parse(event.body);

    return {
        statusCode: 200,
        body: JSON.stringify({
            gpa: (marks /10).toFixed(2),
            letter_grade: marks >=80 ? "A" : marks >= 60 ? "B" : "C"
        })
    };
};