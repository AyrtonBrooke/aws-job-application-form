const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event) => {
    try {

        const record = event.Records[0].dynamodb.NewImage;

        // Extracting fields from the event data
        const applicantName = record.name ? record.name.S : "Unknown Name";
        const dob = record.dob ? record.dob.S : "Unknown DOB";
        const education = record.education ? record.education.S : "Unknown Education";
        const experience = record.experience ? record.experience.S : "Unknown Experience";
        const gender = record.gender ? record.gender.S : "Unknown Gender";
        const applicantId = record.ApplicantID ? record.ApplicantID.S : "Unknown ID";

        const languages = record.languages ? record.languages.L.map(lang => lang.S).join(', ') : "Unknown Languages";
        const countries = record.countries ? record.countries.L.map(country => country.S).join(', ') : "Unknown Countries";

        // Create a custom message with the applicant's name
        const customMessage = `New promising candidate ${applicantName} has filled out their details
        - Email: ${applicantId}
        - DOB: ${dob}
        - Education: ${education}
        - Experience: ${experience}
        - Languages: ${languages}
        - Countries: ${countries}
        - Gender: ${gender}`;
        
        // Set up the parameters for the SNS publish call
        const params = {
            Message: customMessage,
            TopicArn: 'arn:aws:sns:eu-west-2:294133898732:notification'
        };
        
        // Publish the message to the SNS topic
        const data = await sns.publish(params).promise();
        console.log("Message sent to the topic:", data);
        return { status: 'Success', messageId: data.MessageId };
    } catch (error) {
        console.error("Error sending message:", error);
        return { status: 'Failed', error: error.message };
    }
};
