const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const archiver = require("archiver");

dotenv.config();

app.use(express.static(path.join(__dirname,'public')));

//Set ejs as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))


app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  fileUpload({
    limits: {
      fileSize: 10 * 1024 * 1024, //10MB
    },
  })
);

//PORT
const PORT = process.env.PORT || 3000;


// Home Enddpoint
app.get("/", (req, res) => {
  res.render("index") //render index.ejs from views folder
})

// Endpoint for saving cropped images
app.post("/:folderPath*/save-cropped", (req, res) => {
  const { imageName, imageData } = req.body;
  const folderPath = req.params.folderPath;
  const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

  const imagePath = path.join(folderPath, "cropped", imageName);

  // Create a directory if it doesn't exist
  const directory = path.dirname(imagePath);

  fs.mkdirSync(directory, { recursive: true });

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
app.post("/:folderPath*/save-original", (req, res) => {
  const { imageName } = req.body;
  const imageData = req.files && req.files.imageData;
  const folderPath = req.params.folderPath;
  console.log(folderPath, "FOLDER PATH \n");

  if (!imageData) {
    res.status(400).send("No image file received");
    return;
  }

  const imagePath = path.join(folderPath, "original", imageName);

  // Create the directory if it doesn't exist
  const directory = path.dirname(imagePath);
  fs.mkdirSync(directory, { recursive: true });
  imageData.mv(imagePath, (err) => {
    if (err) {
      console.error("Error saving the original image: ", err);
      res.sendStatus(500);
    } else {
      console.log("Original image successfully saved: ", imagePath);
      res.sendStatus(200);
    }
  });
});

// Endpoint for saving the csv file
app.post("/:folderPath*/save-csv", (req, res) => {
  const { imageName, annotatedText, isNepali } = req.body;
  const folderPath = req.params.folderPath;

  const csvPath = path.join(folderPath, "csv", imageName);

  // Create the directory structure if it doesn't exist
  const directory = path.dirname(csvPath);
  fs.mkdirSync(directory, { recursive: true });

  // Create CSV content - Headers and Data
  const csvContent = `Image Name,Annotated Text,Is Nepali\n"${imageName}","${annotatedText}","${isNepali}"`;

  // Write content to the CSV file
  fs.writeFile(csvPath, csvContent, { encoding: "utf8" }, (err) => {
    if (err) {
      console.error("Error writing to CSV file:", err);
      res.sendStatus(500);
      return;
    }
    console.log("Data saved to CSV:", imageName);
    res.sendStatus(200);
  });
});

// Endpoint for zipping files
app.get("/:folderPath/zip-files", async (req, res) => {
  try {
    const folderPath = req.params.folderPath;
    const zipPath = path.join(__dirname, folderPath, "zipped");
    const zipFilePath = path.join(zipPath, "files.zip");

    // Create a directory if it doesn't exist
    await fs.promises.mkdir(zipPath, { recursive: true });

    // Create a new archive file
    const archive = archiver("zip", {
      zlib: { level:5 }, // compression level
    });

    // Create write stream for the zip file
    const output = fs.createWriteStream(zipFilePath);

    // Pipe archive data to the write stream
    archive.pipe(output);

    // Add original image, cropped image, and CSV to the archive
    const originalImagePath = path.join(
      folderPath,
      "original",
      req.query.imageName
    );
    archive.file(originalImagePath, { name: "original.png" });

    const croppedImagePath = path.join(
      folderPath,
      "cropped",
      `cropped_${req.query.index}.png`
    );
    archive.file(croppedImagePath, { name: "cropped.png" });

    const csvPath = path.join(
      folderPath,
      "csv",
      `csv_${req.query.index}.csv`
    );
    archive.file(csvPath, { name: "data.csv" });

    //DEBUG
    console.log("Original Image Path: ", originalImagePath);
    console.log("Cropped Image Path: ", croppedImagePath);
    console.log("CSV Path: ", csvPath);

    // Finalize archive
    await archive.finalize();

    // Wait for the archive to be fully created
    await new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
    });

    console.log("Files zipped successfully");

    // Send the zip file as a response
    res.sendFile(
      zipFilePath,
      {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="files.zip"`,
        },
      },
      (err) => {
        if (err) {
          console.error("Error sending the zip file: ", err);
          res.sendStatus(500);
        }

        // Remove the zip file after it has been sent
        fs.unlink(zipFilePath, (err) => {
          if (err) {
            console.error("Error removing the zip file: ", err);
          }
        });
      }
    );
  } catch (error) {
    console.error("Error zipping files: ", error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`⚡️ Server is running at http://localhost:${PORT}`);
});
