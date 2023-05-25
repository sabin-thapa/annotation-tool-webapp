const fileInput = document.querySelector("#file-input");
const uploadedImage = document.querySelector(".result");
const resultImage = document.querySelector(".img-result");
const croppedImage = document.querySelector(".cropped");
const imageWidth = document.querySelector(".img-w");
const addFolderElement = document.querySelector("#add-folder");
const imageNameElement = document.querySelector("#image-name");

const saveBtn = document.querySelector("#saveButton");
const downloadBtn = document.querySelector("#downloadButton");
const nextBtn = document.querySelector("#next-btn");
const prevBtn = document.querySelector("#prev-btn");

const toggleNepaliSwitchBtn = document.querySelector("#toggleNepaliSwitch"); //toggleNepaliSwitch
const suggestionsElement = document.querySelector("#suggestions"); //suggestionDiv
const inputTextField = document.querySelector("#transliterateTextarea"); //inputField

// Initialize required variables
let cropper = "";
let croppedImageLink = "";
let croppedImageName = "";

//List of files in the folder
let fileList = [];
let currentIndex = 0;
let folderPath = "";
let folderName = "";

let suggestions = [];
let suggestedWord = "";
let nepaliMode = false;

//BASE URL
const baseUrl = "http://localhost:3000";

let saveCroppedEndpoint;
let saveOriginalEndpoint;
let saveCSVEndpoint;

// Run after an image has been selected
fileInput.addEventListener("change", (e) => {
  fileList = e.target.files;
  showImage(0);
});

function showImage(index) {
  if (fileList.length) {
    addFolderElement.classList.add("hide");
    nextBtn.classList.remove("hide");
    prevBtn.classList.remove("hide");
    imageNameElement.classList.remove("hide");

    //First image
    const file = fileList[index];

    //To read the image
    const reader = new FileReader();
    reader.addEventListener("load", (e) => {
      if (e.target.result) {
        //Creating new image
        let img = document.createElement("img");
        img.id = "image";
        img.src = e.target.result;

        //Clean uploaded image
        uploadedImage.innerHTML = "";

        //Append the new image
        uploadedImage.appendChild(img);

        //display buttons
        saveBtn.classList.remove("hide");

        //CROPPER
        cropper = new Cropper(img);
      }
    });
    reader.readAsDataURL(file);

    //Get the folder name of the folder containing images
    folderPath = file.webkitRelativePath;
    folderName = folderPath.substring(0, folderPath.lastIndexOf("/"));
    // console.log(folderName, "folder name \n");

    //Update imageName
    imageNameElement.innerHTML = folderPath;

    //Update the endpoints
    saveCroppedEndpoint = `${baseUrl}/${folderPath}/save-cropped`;
    saveOriginalEndpoint = `${baseUrl}/${folderPath}/save-original`;
    saveCSVEndpoint = `${baseUrl}/${folderPath}/save-csv`;
    generateZipEndpoint = `${baseUrl}/${encodeURIComponent(
      folderName
    )}/save-zip`;
  }
}

// After save button is pressed
saveBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const file = fileList[currentIndex];

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = async function (e) {
      img.src = e.target.result;

      const croppedCanvas = cropper.getCroppedCanvas(img);
      const croppedImageLink = croppedCanvas.toDataURL("image/png");
      const croppedImageName = `cropped_${currentIndex}.png`;

      const originalImageName = `backup_${currentIndex}.png`;

      const csvImageName = `csv_${currentIndex}.csv`;
      const annotatedText = inputTextField.value;
      const isNepali = nepaliMode;

      // Save to CSV
      const csvResponse = await fetch(saveCSVEndpoint, {
        method: "POST",
        body: JSON.stringify({
          imageName: csvImageName,
          annotatedText,
          isNepali,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!csvResponse.ok) {
        throw new Error("Failed to save CSV file!");
      }

      console.log("Saved successfully to CSV");

      // Save cropped image
      const croppedResponse = await fetch(saveCroppedEndpoint, {
        method: "POST",
        body: JSON.stringify({
          imageName: croppedImageName,
          imageData: croppedImageLink,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!croppedResponse.ok) {
        throw new Error("Failed to save cropped image!");
      }

      console.log("Cropped image saved successfully!");

      // Save original image
      const originalFormData = new FormData();
      originalFormData.append("imageName", originalImageName);
      originalFormData.append("imageData", file);

      const originalResponse = await fetch(saveOriginalEndpoint, {
        method: "POST",
        body: originalFormData,
      });

      if (!originalResponse.ok) {
        throw new Error("Failed to save original image!");
      }

      console.log("Original image saved successfully!");
      //Show next image when saved
      showNextImage();
    };

    reader.readAsDataURL(file);

    console.log("Saved");
  } catch (error) {
    console.error("Error saving files:", error);
  }
});

// Iterate through the images in the folder
nextBtn.addEventListener("click", () => {
  showNextImage();
});

function showNextImage() {
  currentIndex = (currentIndex + 1) % fileList.length;
  inputTextField.value = "";
  showImage(currentIndex);
}

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;
  inputTextField.value = "";
  showImage(currentIndex);
});

// Download Zip Button

downloadBtn.addEventListener("click", () => {
  fetch(generateZipEndpoint)
    .then((res) => {
      if (res.ok) {
        return res.blob();
      } else {
        throw new Error("Error generating the zip file --client");
      }
    })
    .then((blob) => {
      //Create a temp link to download the zip
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "files.zip";

      link.click();

      URL.revokeObjectURL(link.href);
    })
    .catch((err) => {
      console.error("Error: ", err);
    });
});

// <! -- Annotation Part -- !>

toggleNepaliSwitchBtn.addEventListener("click", (e) => {
  toggleNepaliMode(e.target.checked);
});

function toggleNepaliMode(isNepaliMode) {
  nepaliMode = isNepaliMode;
  console.log(nepaliMode, "Nepali Mode");
}

inputTextField.addEventListener("keyup", async (e) => {
  if (!nepaliMode) return;
  
  const textValue = e.target.value;
  const selectionIndex = e.target.selectionStart;
  
  // Trim - Remove trailing or leading white spaces
  // Replace - Replace one or more consecutive white space characters with a single space
  // Split - Split the resulting string into an array of substrings
  
  const wordList = textValue.trim().replace(/\s+/g, " ").split(" ");
  
  if (wordList.length == 1 && wordList[0] == "") {
    return;
  }
  
  let wordIndex = -1,
    charCount = 0;
    
  for (let i = 0; i < wordList.length; i++) {
    // Add 1 for space character
    charCount += wordList[i].length + 1;

    if (charCount >= selectionIndex) {
      wordIndex = i; // New word after white space
      break;
    }
  }
  
  wordIndex = wordIndex == -1 ? wordList.length - 1 : wordIndex;
  const selectedWord = wordList[wordIndex];
  
  if (e.key === " ") { // Check if space bar is pressed
    fetch(
      `https://inputtools.google.com/request?text=${selectedWord}&itc=ne-t-i0-und&num=10&ie=utf-8&oe=utf-8`
    )
      .then((res) => res.json())
      .then((data) => {
        suggestions = data[1][0][1];
        suggestedWord = suggestions[0];
        suggestionsElement.innerHTML = "";
        
        suggestions.forEach((suggestion) => {
          let suggestionBtn = document.createElement("button");
          suggestionBtn.textContent = suggestion;
          suggestionBtn.addEventListener("click", () => {
            wordList[wordIndex] = suggestion;
            const finalText = wordList.join(" ") + " ";
            const selectedWordIndex =
              finalText.indexOf(suggestedWord) + suggestedWord.length + 1;
            selectSuggestedWord(finalText, selectedWordIndex);
            suggestionsElement.innerHTML = "";
          });
          suggestionsElement.appendChild(suggestionBtn);
        });
        
        if (data == " " && value[selectionIndex] - 2 !== " ") {
          console.log("Space pressed", suggestedWord);
          wordList[wordIndex] = suggestedWord;
          const finalText = wordList.join(" ") + " ";
          const selectedWordIndex =
            finalText.indexOf(suggestedWord) + suggestedWord.length + 1;
          selectSuggestedWord(finalText, selectedWordIndex);
          suggestionsElement.innerHTML = "";
        }
      });
  }
});


function selectSuggestedWord(text, index) {
  inputTextField.value = text;
  suggestionsElement.innerHTML = "";
  inputTextField.focus();
  inputTextField.setSelectionRange(index, index);
}

// Need to save image name, annotated text and isNepali to a csv file

// function saveToCSV() {
//   //data
//   const imageName = croppedImageName;
//   const annotatedText = inputTextField.value;
//   const isNepali = nepaliMode;

//   //Create CSV content - Headers and Data
//   const csvContent = `data:text/csv;charset=utf-8,Image Name,Annotated Text,Is Nepali\n"${imageName}","${annotatedText}","${isNepali}"`;

//   //Link element to download the CSV file
//   const link = document.createElement("a");
//   link.href = encodeURI(csvContent);
//   link.target = "_blank";
//   link.download = "annotated_data.csv";

//   //Appending the link element to the document body
//   document.body.appendChild(link);

//   //Trigger download
//   link.click();

//   console.log("Saved data to CSV!");
// }
