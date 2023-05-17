const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");

dotenv.config();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(fileUpload({
  limits: {
    fileSize: 10 * 1024 * 1024 //10MB
  }
}));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("<h1> Hello </h1>");
});

// Endpoint for saving cropped images

app.post("/save-cropped", (req, res) => {
  const { imageName, imageData } = req.body;

  const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

  const imagePath = path.join(__dirname, "cropped", imageName);

  // Create a directory if it doesn't exist
  const directory = path.dirname(imagePath);
  fs.mkdir(directory, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating directory:", err);
      res.sendStatus(500);
      return;
    }
  });

  fs.writeFile(imagePath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving the cropped image: ", err);
      res.sendStatus(500).send("Server error saving the cropped image");
    } else {
      console.log("Cropped image successfully: ", imagePath);
      res.sendStatus(200);
    }
  });
});

// Endpoint for saving the original image

app.post("/save-original", (req, res) => {
  const { imageName } = req.body;
  const imageData = req.files && req.files.imageData;

  if (!imageData) {
    res.status(400).send("No image file received");
    return;
  }

  const imagePath = path.join(__dirname, "original", imageName);

  // Create the directory if it doesn't exist
  const directory = path.dirname(imagePath);
  fs.mkdir(directory, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating directory:", err);
      res.sendStatus(500);
      return;
    }
  });
  imageData.mv(imagePath, (err) => {
    if (err) {
      console.error("Error saving the original image: ", err);
      res.sendStatus(500).send("Server error saving the original image");
    } else {
      console.log("Original image successfully saved: ", imagePath);
      res.sendStatus(200);
    }
  });
});

app.post("/save-csv", (req, res) => {
  const {imageName, annotatedText, isNepali} = req.body;
  console.log(imageName, 'Image Name')
  const csvPath = path.join(__dirname, "csv", imageName);

  //Create a directory if it doesn't exist
  const directory = path.dirname(csvPath);
  fs.mkdir(directory, {recursive: true}, (err) => {
    if(err){
      console.error('Error creating directory: ', err);
      res.sendStatus(500);
      return;
    }
  })
   //Create CSV content - Headers and Data
   const csvContent = `Image Name,Annotated Text,Is Nepali\n"${imageName}","${annotatedText}","${isNepali}"`;
 
  //Write content to csv file
  fs.writeFile(csvPath, csvContent, {encoding: "utf8"}, (err) => {
    if(err){
      console.error('Error writing to csv file: ', err);
      res.sendStatus(500);
      return;
    }
    console.log('Data saved to CSV: ', imageName);
    res.sendStatus(200)
  })
})

app.listen(PORT, () => {
  console.log("Server started at port: ", PORT);
});
