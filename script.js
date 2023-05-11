let fileInput = document.querySelector("#file-input");
let uploadedImage = document.querySelector(".result");
let resultImage = document.querySelector(".img-result");
let croppedImage = document.querySelector(".cropped");
let imageWidth = document.querySelector(".img-w");

let options = document.querySelector(".options");
let saveBtn = document.querySelector(".save");
let downloadBtn = document.querySelector(".download");
let nextBtn = document.querySelector("#next-btn");
let prevBtn = document.querySelector("#prev-btn");

let cropper = "";

//List of files in the folder
let fileList = [];
let currentIndex = 0;

const saveCroppedEndpoint = `http://localhost:3000/save-cropped`;
const saveOriginalEndpoint = `http://localhost:3000/save-original`;

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
  
    // const img = document.querySelector(".result img");

    // Get cropped area of the image
    const croppedCanvas = cropper.getCroppedCanvas();
  
    // Save cropped image
    const croppedImageName = `cropped_${currentIndex}.png`;
    const croppedImageLink = croppedCanvas.toDataURL("image/png");
  
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
