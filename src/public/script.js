const fileInput = document.querySelector("#file-input");
const uploadedImage = document.querySelector(".result");
const resultImage = document.querySelector(".img-result");
const croppedImage = document.querySelector(".cropped");
const imageWidth = document.querySelector(".img-w");
const addFolderElement = document.querySelector("#add-folder");
const imageNameElement = document.querySelector("#image-name");

const downloadBtn = document.querySelector("#downloadButton");
const nextBtn = document.querySelector("#next-btn");
const prevBtn = document.querySelector("#prev-btn");

const toggleNepaliSwitchBtn = document.querySelector("#toggleNepaliSwitch"); //toggleNepaliSwitch
const suggestionsElement = document.querySelector("#suggestions"); //suggestionDiv
const inputTextField = document.querySelector("#transliterateTextarea"); //inputField

//Special Characters
const specialCharSelectionDiv = document.querySelector(
  ".special-char-selection"
);
const specialCharacters = document.querySelector("#special-characters");
const selectSpecialCharacterBtn = document.querySelector(
  "#select-special-character"
);

const specialCharButtons = document.querySelectorAll(
  ".special-char-selection button"
);

//Invalid checkbox
const invalidContainer = document.querySelector("#invalid-container");
const invalidCheckbox = document.querySelector("#invalid-checkbox");
let isInvalid = false;

// Initialize required variables
let cropper = "";
let croppedImageLink = "";
let croppedImageName = "";
let originalImageName = "";

//List of files in the folder
let fileList = [];
let currentIndex = 0;
let folderPath = "";
let folderName = "";
let fileName = "";

//Annotations
let annotations = {};

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

//Invalid checkbox updates
invalidCheckbox.addEventListener("change", () => {
  if (invalidCheckbox.checked) {
    isInvalid = true;
  } else {
    isInvalid = false;
  }
});

function showImage(index) {
  if (fileList.length) {
    addFolderElement.classList.add("hide");
    nextBtn.classList.remove("hide");
    prevBtn.classList.remove("hide");
    downloadBtn.classList.remove("hide");
    imageNameElement.classList.remove("hide");
    invalidContainer.classList.remove("hide");

    invalidCheckbox.checked = false;
    isInvalid = false;

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

        //CROPPER
        cropper = new Cropper(img, {
          autoCropArea: 1,
        });
      }
    });
    reader.readAsDataURL(file);

    //Retrieve the annotated text for the currrent image
    const savedAnnotation = annotations[currentIndex];
    if (savedAnnotation) {
      inputTextField.value = savedAnnotation;
    } else {
      inputTextField.value = "";
    }

    //Get the folder name of the folder containing images
    folderPath = file.webkitRelativePath;
    folderName = folderPath.substring(0, folderPath.lastIndexOf("/"));
    console.log(folderPath, "folder path \n");
    fileName = folderPath.split("/", 2)[1];
    console.log(fileName, "file name \n");

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

async function saveData(action) {
  try {
    const file = fileList[currentIndex];
    console.log(currentIndex, "curr index save data");

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = async function (e) {
      img.src = e.target.result;

      const croppedCanvas = cropper.getCroppedCanvas(img);
      croppedImageLink = croppedCanvas.toDataURL("image/png");
      croppedImageName = fileName;

      originalImageName = fileName;

      const annotatedText = inputTextField.value;
      const isNepali = nepaliMode;

      // Save to CSV
      const csvResponse = await fetch(saveCSVEndpoint, {
        method: "POST",
        body: JSON.stringify({
          imageName: originalImageName,
          annotatedText,
          isNepali,
          isInvalid,
          folderName,
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

      // // Save original image
      // const originalFormData = new FormData();
      // originalFormData.append("imageName", originalImageName);
      // originalFormData.append("imageData", file);

      // const originalResponse = await fetch(saveOriginalEndpoint, {
      //   method: "POST",
      //   body: originalFormData,
      // });

      // if (!originalResponse.ok) {
      //   throw new Error("Failed to save original image!");
      // }

      // console.log("Original image saved successfully!");

      if (action === "next") {
        currentIndex = (currentIndex + 1) % fileList.length;
      } else if (action === "previous") {
        currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;
      }

      inputTextField.value = annotations[currentIndex] || "";
      showImage(currentIndex);
    };

    reader.readAsDataURL(file);

    // Save the annotated text to the data structure
    annotations[currentIndex] = inputTextField.value;

    console.log("Saved");
  } catch (error) {
    console.error("Error saving files:", error);
  }
}

// Save all original images
async function saveOriginalImages() {
  try {
    // Iterate over each file in the fileList
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const originalFormData = new FormData();
      const imageName = file.name;
      originalFormData.append("imageName", imageName);
      originalFormData.append("imageData", file);

      const originalResponse = await fetch(saveOriginalEndpoint, {
        method: "POST",
        body: originalFormData,
      });

      if (!originalResponse.ok) {
        throw new Error("Failed to save original image:", imageName);
      }

      console.log("Original image saved successfully:", imageName);
    }
  } catch (error) {
    console.error("Error saving original images:", error);
  }
}

// Iterate through the images in the folder
nextBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const currentText = inputTextField.value;
  const previousText = annotations[currentIndex] || "";
  if (isSameText(currentText, previousText)) {
    currentIndex = (currentIndex + 1) % fileList.length;
    showImage(currentIndex);
  } else if (inputTextField.value !== "" || isInvalid === true) {
    await saveData("next");
  } else {
    currentIndex = (currentIndex + 1) % fileList.length;
    inputTextField.value = annotations[currentIndex] || "";
    showImage(currentIndex);
  }
});

prevBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const currentText = inputTextField.value;
  const previousText = annotations[currentIndex] || "";
  if (isSameText(currentText, previousText)) {
    currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;

    showImage(currentIndex);
  } else if (inputTextField.value !== "" || isInvalid === true) {
    await saveData("next");
  } else {
    currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;

    inputTextField.value = annotations[currentIndex] || "";
    showImage(currentIndex);
  }
});

// Helper function to check equality of strings
function isSameText(text1, text2) {
  return text1.trim() === text2.trim();
}

function showNextImage() {
  currentIndex = (currentIndex + 1) % fileList.length;
  inputTextField.value = annotations[currentIndex] || "";
  showImage(currentIndex);
}

function showPreviousImage() {
  currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;
  inputTextField.value = annotations[currentIndex] || "";
  showImage(currentIndex);
}
async function saveNonAnnotatedImagesToCSV() {
  const fileArray = Array.from(fileList);
  const nonAnnotatedImages = fileArray.filter((file, index) => {
    return !annotations[currentIndex];
  });

  nonAnnotatedImages.map(async (file) => {
    const csvResponse = await fetch(saveCSVEndpoint, {
      method: "POST",
      body: JSON.stringify({
        imageName: file.name,
        annotatedText: "",
        isNepali: "",
        isInvalid: "",
        folderName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!csvResponse.ok) {
      throw new Error("Failed to save CSV file!");
    }
  });
}

// Download Zip Button

downloadBtn.addEventListener("click", async () => {
  try {
    await saveOriginalImages();
    await saveNonAnnotatedImagesToCSV()
    const zipResponse = await fetch(generateZipEndpoint);
    if (zipResponse.ok) {
      const blob = await zipResponse.blob();

      // Create a temporary link to download the zip
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${folderName}.zip`;

      link.click();

      URL.revokeObjectURL(link.href);
    } else {
      throw new Error("Error generating the zip file --client");
    }
  } catch (err) {
    console.error("Error: ", err);
  }
});

// <! -- Annotation Part -- !>

toggleNepaliSwitchBtn.addEventListener("click", (e) => {
  toggleNepaliMode(e.target.checked);
  if (nepaliMode) {
  }
});

function toggleNepaliMode(isNepaliMode) {
  nepaliMode = isNepaliMode;
  console.log(nepaliMode, "Nepali Mode");
  if (nepaliMode) {
    specialCharSelectionDiv.classList.remove("hide");
    specialCharButtons.classList.remove("hide");
  } else {
    specialCharSelectionDiv.classList.add("hide");
    specialCharButtons.classList.add("hide");
  }
}
inputTextField.addEventListener("keyup", async (e) => {
  if (!nepaliMode) return;

  const textValue = e.target.value;
  const selectionIndex = e.target.selectionStart;

  // Trim - Remove trailing or leading white spaces
  // Replace - Replace one or more consecutive white space characters with a single space
  // Split - Split the resulting string into an array of substrings

  const wordList = textValue.trim().replace(/\s+/g, " ").split(" ");

  if (wordList.length === 1 && wordList[0] === "") {
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

  wordIndex = wordIndex === -1 ? wordList.length - 1 : wordIndex;
  const selectedWord = wordList[wordIndex];

  if (e.key === " ") {
    suggestionsElement.innerHTML = ""; // Clear suggestions div
  } else {
    fetch(
      `https://inputtools.google.com/request?text=${selectedWord}&itc=ne-t-i0-und&num=10&ie=utf-8&oe=utf-8`
    )
      .then((res) => res.json())
      .then((data) => {
        suggestions = data[1][0][1];
        suggestedWord = suggestions[0];
        suggestionsElement.innerHTML = "";

        if (data !== " " || value[selectionIndex - 2] === " ") {
          suggestions.forEach((suggestion) => {
            let suggestionBtn = document.createElement("button");
            suggestionBtn.textContent = suggestion;
            suggestionBtn.addEventListener("click", () => {
              wordList[wordIndex] = suggestion;
              const finalText = wordList.join(" ");
              const selectedWordIndex =
                finalText.indexOf(suggestedWord) + suggestedWord.length + 1;
              selectSuggestedWord(finalText, selectedWordIndex);
              suggestionsElement.innerHTML = "";
            });
            suggestionsElement.appendChild(suggestionBtn);
          });
        }

        if (data === " " && value[selectionIndex] - 2 !== " ") {
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

// Special Characters

specialCharButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectSpecialCharacter(button.textContent.trim()).catch((err) => {
      console.error(err);
    });
  });
});

// selectSpecialCharacterBtn.addEventListener("click", () => {
//   selectSpecialCharacter().catch((err) => {
//     console.error(err);
//   });
// });

function selectSpecialCharacter(selectedOption) {
  return new Promise((resolve, reject) => {
    const textValue = inputTextField.value;
    const selectionStart = inputTextField.selectionStart;
    const selectionEnd = inputTextField.selectionEnd;

    const beforeSelection = textValue.slice(0, selectionStart);
    const afterSelection = textValue.slice(selectionEnd);

    const finalText = beforeSelection + selectedOption + afterSelection;

    inputTextField.value = finalText;
    inputTextField.focus();
    inputTextField.setSelectionRange(
      selectionStart + selectedOption.length,
      selectionStart + selectedOption.length
    );

    resolve();
  });
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
