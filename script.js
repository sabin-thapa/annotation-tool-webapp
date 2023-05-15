const fileInput = document.querySelector("#file-input");
const uploadedImage = document.querySelector(".result");
const resultImage = document.querySelector(".img-result");
const croppedImage = document.querySelector(".cropped");
const imageWidth = document.querySelector(".img-w");

const options = document.querySelector(".options");
const saveBtn = document.querySelector("#saveButton");
const downloadBtn = document.querySelector(".download");
const nextBtn = document.querySelector("#next-btn");
const prevBtn = document.querySelector("#prev-btn");

const toggleNepaliSwitchBtn = document.querySelector("#toggleNepaliSwitch"); //toggleNepaliSwitch
const suggestionsElement = document.querySelector("#suggestions"); //suggestionDiv
const inputTextField = document.querySelector("#transliterateTextarea"); //inputField

let cropper = "";
let croppedImageLink = "";
let croppedImageName = "";

//List of files in the folder
let fileList = [];
let currentIndex = 0;

let suggestions = [];
let suggestedWord = "";
let nepaliMode = false;

const saveCroppedEndpoint = `http://localhost:3000/save-cropped`;
const saveOriginalEndpoint = `http://localhost:3000/save-original`;
const saveCSVEndpoint = `http://localhost:3000/save-csv`;

// After an image has been selected
fileInput.addEventListener("change", (e) => {
  fileList = e.target.files;
  showImage(0);
});

function showImage(index) {
  if (fileList.length) {
    console.log("hey");

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
        options.classList.remove("hide");

        //CROPPER
        cropper = new Cropper(img);
      }
    });
    reader.readAsDataURL(file);
  }
}

saveBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const img = document.querySelector(".result img");

  // Get cropped area of the image
  const croppedCanvas = cropper.getCroppedCanvas();

  // Save cropped image
  croppedImageName = `cropped_${currentIndex}.png`;
  croppedImageLink = croppedCanvas.toDataURL("image/png");

  fetch(saveCroppedEndpoint, {
    method: "POST",
    body: JSON.stringify({
      imageName: croppedImageName,
      imageData: croppedImageLink,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (res.ok) {
        console.log("Cropped image saved successfully!");

        // Save original image
        const originalImageName = `backup_${currentIndex}.png`;
        const originalImageFile = fileList[currentIndex];

        const formData = new FormData();
        formData.append("imageName", originalImageName);
        formData.append("imageData", originalImageFile);

        fetch(saveOriginalEndpoint, {
          method: "POST",
          body: formData,
        })
          .then((res) => {
            if (res.ok) {
              console.log("Original image saved successfully!");
            } else {
              console.error("Failed to save original image!");
            }
            return res.text();
          })
          .then((data) => {
            console.log(data, "Save original image response");
          })
          .catch((err) => {
            console.error("Error saving original image: ", err);
          });
      } else {
        console.error("Failed to save cropped image!");
      }
    })
    .catch((err) => {
      console.error("Error saving cropped image: ", err);
    });

  // SAVE TO CSV
  //data
  const  imageName = `csv_${currentIndex}.csv`
  const annotatedText = inputTextField.value;
  const isNepali = nepaliMode;

  fetch(saveCSVEndpoint, {
    method: "POST",
    body: JSON.stringify({
      imageName,
      annotatedText,
      isNepali,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (res.ok) {
      console.log("Saved successfully to CSV");
    }
  });

  console.log("saved");
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % fileList.length;
  showImage(currentIndex);
});

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;
  showImage(currentIndex);
});

// <! -- Annotation Part -- !>

toggleNepaliSwitchBtn.addEventListener("click", (e) => {
  toggleNepaliMode(e.target.checked);
});

function toggleNepaliMode(isNepaliMode) {
  nepaliMode = isNepaliMode;
  console.log(nepaliMode, "Nepali Mode");
}

inputTextField.addEventListener("input", async (e) => {
  if (!nepaliMode) return;

  const textValue = e.target.value;
  const selectionIndex = e.target.selectionStart;

  //trim - Remove trailing or leading white spaces
  //replace - Replace one or more consecutive white space characters with a single space
  //split - split the resulting string into an array of substrings

  const wordList = textValue.trim().replace(/\s+/g, " ").split(" ");
  // console.log(wordList, "wordlist");

  if (wordList.length == 1 && wordList[0] == "") {
    return;
  }

  let wordIndex = -1,
    charCount = 0;
  console.log(selectionIndex, "selection index");

  for (let i = 0; i < wordList.length; i++) {
    // Add 1 for space character
    charCount += wordList[i].length + 1;
    console.log(wordList[i].length, charCount);

    if (charCount >= selectionIndex) {
      wordIndex = i; //new word after white space
      break;
    }
  }
  console.log(wordIndex, "wordIndex");

  wordIndex = wordIndex == -1 ? wordList.length - 1 : wordIndex;

  const selectedWord = wordList[wordIndex];

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
