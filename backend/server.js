const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

app.use(cors());
app.use(express.json());

// S3 bucket name
const BUCKET_NAME = 'file-converter-app'; // Your bucket name

// File conversion route
app.post("/api/convert", upload.single("file"), async (req, res) => {
  const file = req.file;
  const outputFormat = req.body.format;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Upload file to S3
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: `uploads/${file.originalname}`,
    Body: require("fs").createReadStream(file.path),
  };

  try {
    const uploadedFile = await s3.upload(uploadParams).promise();

    // Invoke Lambda function for file conversion
    const lambdaParams = {
      FunctionName: 'fileConverterLambda', // Your Lambda function name
      Payload: JSON.stringify({
        bucket: BUCKET_NAME,
        key: file.originalname,
        outputFormat,
      }),
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const lambdaResult = JSON.parse(lambdaResponse.Payload);

    // Send the converted file URL back to the frontend
    return res.status(200).json({
      message: lambdaResult.message,
      convertedFileUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${lambdaResult.convertedFileKey}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error processing file" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
