let fileInput = document.querySelector('#file-input')
let uploadedImage = document.querySelector('.result')
let resultImage = document.querySelector('.img-result')
let croppedImage = document.querySelector('.cropped')
let imageWidth = document.querySelector('.img-w')

let options = document.querySelector('.options')
let saveBtn = document.querySelector('.save')
let downloadBtn = document.querySelector('.download')

let cropper = ""


// After an image has been selected
fileInput.addEventListener('change', e => {
    console.log(e.target.files)
    if (e.target?.files?.length) {
        console.log('hey')
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
        reader.readAsDataURL(e.target.files[0])
    }
})

saveBtn.addEventListener('click', e => {
    e.preventDefault();

    let imgSrc = cropper.getCroppedCanvas({
        width: imageWidth.value
    }).toDataURL();

    croppedImage.classList.remove('hide')
    downloadBtn.classList.remove('hide')
    downloadBtn.download = 'imagename.png'
    downloadBtn.setAttribute('href', imgSrc)
})