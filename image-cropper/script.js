let fileInput = document.querySelector('#file-input')
let uploadedImage = document.querySelector('.result')
let resultImage = document.querySelector('.img-result')
let croppedImage = document.querySelector('.cropped')
let imageWidth = document.querySelector('.img-w')

let options = document.querySelector('.options')
let saveBtn = document.querySelector('.save')
let downloadBtn = document.querySelector('.download')
let nextBtn = document.querySelector('#next-btn')
let prevBtn = document.querySelector('#prev-btn')

let cropper = ""

//List of files in the folder
let fileList = []
let currentIndex = 0;

// After an image has been selected
fileInput.addEventListener('change', e => {
    fileList = e.target.files;
    showImage(0)

})

function showImage(index) {
    if (fileList.length) {
        console.log('hey')

        //First image
        const file = fileList[index]
        
        //To read the image
        const reader = new FileReader();
        reader.addEventListener('load', e => {
            if(e.target.result) {
                //Creating new image
                let img = document.createElement('img');
                img.id = 'image';
                img.src = e.target.result;

                //Clean uploaded image
                uploadedImage.innerHTML = '';

                //Append the new image
                uploadedImage.appendChild(img);

                //display buttons
                saveBtn.classList.remove('hide')
                options.classList.remove('hide')

                //CROPPER
                cropper = new Cropper(img)
            }
        })
        reader.readAsDataURL(file)
    }
}

saveBtn.addEventListener('click', e => {
    e.preventDefault();

    let imgSrc = cropper.getCroppedCanvas({
        width: imageWidth.value
    }).toDataURL();

    let downloadLink = document.createElement('a');
    downloadLink.href = imgSrc;
    downloadLink.download = `cropped_${currentIndex}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    // croppedImage.classList.remove('hide')
    // downloadBtn.classList.remove('hide')
    // downloadBtn.download = 'imagename.png'
    // downloadBtn.setAttribute('href', imgSrc)
})

nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % fileList.length;
    showImage(currentIndex)
})

prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + fileList.length) % fileList.length;
    showImage(currentIndex)
})