export const handler  = async (event: any) =>{
    const {student_id} = JSON.parse(event.body);

    return {
        statusCode : 200,
        body: JSON.stringify({
            url: 'https://mock-certificates.com/${student_id}.pdf',
            expiry: "2025-12-31"
        })

    };
};