const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const textract = new AWS.Textract();

exports.handler = async (event) => {
    try {
        const bucket = 'applicant-cvs'; // Name of your S3 bucket
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        console.log(`Processing file: ${key} from bucket: ${bucket}`);

        const params = {
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                }
            },
            FeatureTypes: ["FORMS", "TABLES"]
        };

        const data = await textract.analyzeDocument(params).promise();
        const extractedText = data.Blocks.map(block => block.Text).join('\n');

        const outputBucket = 'extracted-txt'; // Separate bucket for processed data
        const outputKey = `extracted-${key.replace('.pdf', '.txt')}`; // Ensure .txt extension
        const uploadParams = {
            Bucket: outputBucket,
            Key: outputKey,
            Body: extractedText,
            ContentType: 'text/plain'
        };

        const uploadStatus = await s3.putObject(uploadParams).promise();
        console.log('File uploaded successfully:', uploadStatus);

        return {
            statusCode: 200,
            body: JSON.stringify('Text extraction and upload successful!')
        };
    } catch (err) {
        console.error("Error in processing:", err);
        return {
            statusCode: 500,
            body: JSON.stringify('Failed to process the document')
        };
    }
};
