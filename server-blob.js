import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import azureStorage from "azure-storage";
import intoStream from "into-stream";
import dotenv from "dotenv";

// 1. The support for __dirname is not available in Node.js with ES 6 support
// so use the fileURLToPath() function to read the directory path
const __filename = fileURLToPath(import.meta.url);
// 2. The port from which REST API will be accessible
const port = process.env.PORT || 7001;
// 3. Defining instance of express
const instance = new express();

// 4. defining the container name
const containerName = "imagecontainer";

// 5. The directory path, this will be the path for the  directory where the server is running
const __dirname = path.dirname(__filename);
// 6. Environment configuration to read keys from the .env file 
dotenv.config();
// 7. configure the file upload middleware
instance.use(
  fileUpload({
    createParentPath: true,
  })
);
// 8. connecting the BLOB Service using the Connection String
const blobService = azureStorage.createBlobService(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

instance.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// 9. the post request to to accept posted file from the client  
instance.post("/fileupload", (request, response) => {
  // 9.1. If the file not found then respond error
  if (!request.files) {
    return res.status(400).send("No files are received.");
  }

  // 9.2. Read the file
  const file = request.files.file;
  // 9.3. The file path where to store the file
  const path = __dirname + "/files/" + file.name;
  // 9.4. Copy the file in 'files' folder
  file.mv(path, (err) => {
    // 9.5. If error occurred then send error response
    if (err) {
      return response.status(500).send(err);
    }
    // 9.6. Send the success response
    return response.send({ status: "success", path: path });
  });
});
// 10. Post request for accepting file from the client and uploading it on Blob storage 
instance.post("/blobupload", (request, response) => {
  if (!request.files) {
    return res.status(400).send("No files are received.");
  }

  // 10.1. read the file name received from the client 
  const blobName = request.files.file.name;
  console.log(`Blob Name ${blobName}`);
  // 10.2. convert the file into stream
  const stream = intoStream(request.files.file.data);
  console.log(`stream ${stream}`);
  // 10.3. Read the Length of the file
  const streamLength = request.files.file.data.length;
  console.log(`Length ${streamLength}`);
  // 10.4. Upload the file from to the Blob
  blobService.createBlockBlobFromStream(
    containerName,
    blobName,
    stream,
    streamLength,
    (err) => {
      if (err) {
        response.status(500);
        response.send({ message: "Error Occured" });
        return;
      }

      response.status(200).send({message: 'File Uploaded Successfully'});
    }
  );
});
// 11. Start listening the server on the port
instance.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
