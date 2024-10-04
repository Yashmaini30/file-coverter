const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" }); // Temporary file storage

app.use(cors()); // Enable CORS

app.use(express.json());

// File conversion route
app.post("/api/convert", upload.single("file"), (req, res) => {
  const file = req.file;
  const outputFormat = req.body.format;

  // Log file and format to test the API
  console.log("Received file:", file);
  console.log("Output format:", outputFormat);

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  return res.status(200).json({ message: "File uploaded successfully!" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
