import React, { useState } from "react";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("");

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
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            {/* Add more format options as needed */}
          </select>
        </div>
        <button type="submit">Convert</button>
      </form>
    </div>
  );
};

export default FileUpload;
