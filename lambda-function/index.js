const AWS = require("aws-sdk");
const pdf = require("pdf-parse");

const s3 = new AWS.S3();

exports.handler = async (event) => {
  let parsedBody;

  try {
    parsedBody = JSON.parse(event.body);
  } catch (err) {
    console.error("Error parsing event body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body. Expected JSON format." }),
    };
  }

  const { bucket, key, outputFormat } = parsedBody;

  // Validate required fields
  if (!bucket || !key || !outputFormat) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields (bucket, key, outputFormat)" }),
    };
  }

  // Check if output format is 'txt'
  if (outputFormat !== 'txt') {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Unsupported output format. Only 'txt' is supported for PDF conversion." }),
    };
  }

  try {
    // 1. Check if the file exists in S3
    await s3.headObject({ Bucket: bucket, Key: key }).promise();

    // 2. Get the file from S3
    const fileData = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    console.log(`Successfully retrieved file from S3: ${key}`);

    // 3. Convert the PDF file to text
    const convertedFileData = await convertPDFToText(fileData.Body);

    // 4. Save the converted text back to S3
    const convertedKey = `converted/${key.split("/").pop().replace('.pdf', '.txt')}`;
    await s3.putObject({
      Bucket: bucket,
      Key: convertedKey,
      Body: convertedFileData,
      ContentType: 'text/plain',
    }).promise();
    console.log(`Successfully saved converted file to S3: ${convertedKey}`);

    // 5. Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File converted successfully",
        convertedFileKey: convertedKey,
      }),
    };
  } catch (err) {
    console.error("Error processing file:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing file",
        error: err.message,
      }),
    };
  }
};

// Function to convert PDF to text
async function convertPDFToText(fileData) {
  try {
    const data = await pdf(fileData);
    return data.text; 
  } catch (err) {
    console.error("Error converting PDF to text:", err);
    throw new Error("PDF conversion failed.");
  }
}
