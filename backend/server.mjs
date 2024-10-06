import dotenv from "dotenv"; 
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

dotenv.config(); 

const app = express();
const upload = multer({ dest: "uploads/" });

// AWS SDK  credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.use(cors());
app.use(express.json());


const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME;

const uploadFileToS3 = async (file) => {
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: `uploads/${file.originalname}`, // S3 key
    Body: fs.createReadStream(file.path), // Read file from the uploaded file path
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log("File uploaded successfully", data);
    return `uploads/${file.originalname}`; // Return the key for further use
  } catch (err) {
    console.error("Error uploading file to S3", err);
    throw err;
  }
};

// Invoke Lambda function for file conversion
const invokeLambdaForConversion = async (key, outputFormat) => {
  const lambdaParams = {
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({
      bucket: BUCKET_NAME,
      key: key,
      outputFormat: outputFormat,
    }),
  };

  try {
    const data = await lambdaClient.send(new InvokeCommand(lambdaParams));
    const lambdaResult = JSON.parse(new TextDecoder('utf-8').decode(data.Payload));
    console.log("Lambda function invoked successfully", lambdaResult);
    return lambdaResult; // Return Lambda result to the client
  } catch (err) {
    console.error("Error invoking Lambda", err);
    throw err;
  }
};

// Route for file upload and conversion
app.post("/api/convert", upload.single("file"), async (req, res) => {
  const file = req.file;
  const outputFormat = req.body.format;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  if (!outputFormat) {
    return res.status(400).json({ message: "No output format specified" });
  }

  try {
    // 1. Upload the file to S3
    const s3Key = await uploadFileToS3(file);

    // 2. Invoke Lambda for conversion
    const lambdaResult = await invokeLambdaForConversion(s3Key, outputFormat);

    // 3. Send back the converted file URL
    return res.status(200).json({
      message: lambdaResult.message,
      convertedFileUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${lambdaResult.convertedFileKey}`,
    });
  } catch (err) {
    console.error("Error processing file:", err);
    return res.status(500).json({ message: "File processing failed" });
  } finally {
    // Clean up uploaded file from the server
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
