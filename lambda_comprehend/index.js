const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const comprehend = new AWS.Comprehend();

exports.handler = async (event) => {
    try {
        // Extract bucket name and key from the event
        const sourceBucket = event.Records[0].s3.bucket.name;
        const sourceKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        // Get the .txt file from the source bucket
        const data = await s3.getObject({ Bucket: sourceBucket, Key: sourceKey }).promise();
        const text = data.Body.toString('utf-8');  // Convert the binary data to text

        // Use Comprehend to analyze the text for key phrases
        const keyPhraseParams = {
            LanguageCode: 'en',  // Assuming English; adjust as needed
            Text: text
        };
        const keyPhraseResults = await comprehend.detectKeyPhrases(keyPhraseParams).promise();

        // Filter and process key phrases
    const filteredKeyPhrases = keyPhraseResults.KeyPhrases
    .map(kp => kp.Text)
    .filter(kp => !/(January|February|March|April|May|June|July|August|September|October|November|December|\d{4})/.test(kp))  // Regex to exclude months and years
    .filter(kp => kp.length > 3)  // Exclude too short phrases
    .reduce((acc, kp) => {
        const normalized = kp.toLowerCase();
        acc[normalized] = (acc[normalized] || 0) + 1;
        return acc;
    }, {});

// Create a formatted text containing the key phrases with improved styling
let analyzedData = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Text Analysis Results</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        h2 {
            font-size: 28px;
            color: #4A90E2;
            margin-bottom: 10px;
        }
        h3 {
            font-size: 22px;
            color: #333;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        ul {
            list-style-type: none;
            padding: 0;
            margin-top: 0;
        }
        li {
            background-color: #fff;
            margin-bottom: 5px;
            padding: 10px;
            border-left: 5px solid #4A90E2;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <h2>Text Analysis Results</h2>
    <div>
        <h3>Key Phrases:</h3>
        <ul>`;

        Object.entries(filteredKeyPhrases).forEach(([phrase, count]) => {
            analyzedData += `<li>${phrase} (mentioned ${count} times)</li>`;
        });

analyzedData += `        </ul>
    </div>
</body>
</html>`;

        // Specify the new key for the HTML file in the destination bucket
        const destinationBucket = "text-anaylsis"; // Replace with your destination bucket name
        const destinationKey = sourceKey.replace('.txt', '.html');

        // Upload the analyzed data to the destination bucket
        await s3.putObject({ Bucket: destinationBucket, Key: destinationKey, Body: analyzedData }).promise();
        console.log("Analysis result saved to S3:", destinationKey);

        return { statusCode: 200, body: JSON.stringify('Text processed and saved successfully') };
    } catch (err) {
        console.error("Error in processing:", err);
        return { statusCode: 500, body: JSON.stringify('Failed to process and save data') };
    }
};
