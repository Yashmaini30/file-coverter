import React, { useState } from "react";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("");
  const [convertedFileUrl, setConvertedFileUrl] = useState(null); // Step 1: State for converted file URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.querySelector('input[type="file"]');
    const formatInput = format;  // Get the format from state

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("format", formatInput);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setConvertedFileUrl(data.convertedFileUrl); // Step 2: Set the converted file URL
      console.log("Success:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>File Converter</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="file">Upload file:</label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>
        <div>
          <label htmlFor="format">Select format:</label>
          <select
            id="format"
            name="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            required
          >
            <option value="" disabled>Select output format</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
          </select>
        </div>
        <button type="submit">Convert</button>
      </form>
      
      {/* Step 3: Render download link if convertedFileUrl is set */}
      {convertedFileUrl && (
        <div>
          <h2>Download Converted File:</h2>
          <a href={convertedFileUrl} target="_blank" rel="noopener noreferrer">
            Download File
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
