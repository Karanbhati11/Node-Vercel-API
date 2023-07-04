const stream = require("stream");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { google } = require("googleapis");
const app = express();
const upload = multer();
const cors = require("cors");
const corsOptions = {
  // origin: "https://ytdownloadfrontend.netlify.app",
  origin: "http://localhost:3000",
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello Backend")
});

app.listen(5050, () => {
  console.log("Form running on port 5050");
});

const KEYFILEPATH = path.join(__dirname, "cred.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

app.post("/upload", upload.any(), async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.files);
    const { body, files } = req;

    for (let f = 0; f < files.length; f += 1) {
      await uploadFile(files[f]);
    }
    res.status(200).send("Uploaded");
  } catch (f) {
    res.send(f.message);
  }
});

const uploadFile = async (fileObject) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);
  const { data } = await google.drive({ version: "v3", auth }).files.create({
    media: {
      mimeType: fileObject.mimeType,
      body: bufferStream,
    },
    requestBody: {
      name: fileObject.originalname,
      parents: ["1U919T6rJEcUjjHrd68jxMXFsOr9izMDi"],
    },
    fields: "id,name",
  });
  console.log(`Uploaded file ${data.name} ${data.id}`);
};

app.post("/downloadfile", async (req, res) => {
  const drive = google.drive({ version: "v3", auth });
  var fileId = req.body.ID;

  await drive.files.get(
    { fileId: fileId, alt: "media" },
    { responseType: "stream" },
    function (err, resp) {
      const body = [];
      resp.data
        .on("data", (chunk) => {
          body.push(chunk);
        })
        .on("end", () => {
          const parsedBody = Buffer.concat(body);
          res.send(parsedBody);
        });
      resp.data.on("error", () => {
        console.log(err);
      });
    }
  );
});

app.get("/filedetails", async (req, res) => {
  const drive = google.drive({ version: "v3", auth });
  const files = [];

  try {
    const resp = await drive.files.list({ q: "mimeType='application/pdf'" });
    Array.prototype.push.apply(files, res.files);
    resp.data.files.forEach(function (file) {
      //   console.log("Found file:", file.name, file.id);
    });

    res.send(resp.data.files);
  } catch (err) {
    throw err;
  }
});
