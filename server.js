const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const port = process.env.PORT || 7001;
const instance = express();

instance.use(fileUpload({
    createParentPath: true
}));

instance.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

instance.post("/fileupload", (request, response) => {
  if (!request.files) {
    return res.status(400).send("No files are received.");
  }

  const file = request.files.file;
  const path = __dirname + "/files/" + file.name;
  file.mv(path, (err) => {
    if (err) {
      return response.status(500).send(err);
    }
    return response.send({ status: "success", path: path });
  });
});

instance.listen(port, ()=>{
    console.log(`Server is listening on port ${port}`);
})

