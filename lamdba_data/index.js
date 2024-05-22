const AWS = require('aws-sdk');
const dynamodb  = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        console.log('Raw input data:', event); // Add this line to log the raw input data

        const formData = {
                name: event.name,
                dob: event.dob,
                education: event.education,
                experience: event.experience,
                gender: event.gender,
                continents: event.continents,
                countries: event.countries,
                languages: event.languages,
        };

        const item = {
            ApplicantID: event.email,
            ...formData, // Use the form data as attributes
          };

// Store the form data in DynamoDB
await storeFormData(item);

return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Form submitted successfully' }),
  };
} catch (error) {
  console.error(error);
  return {
    statusCode: 500,
    body: JSON.stringify({ message: 'Error submitting the form' }),
  };
}
};

async function storeFormData(item) {
const params = {
  TableName: 'ApplicantData',
  Item: item,
};

await dynamodb.put(params).promise();
};
