# Annotation-Tool---WebApp

This is a web-based tool for annotating text in images that have been cropped out of a form. The webapp allows annotators to input what is written in the image and record if the image contains English or Nepali text. In case of Nepali text, the tool provides a way to write in Nepali using a text romanizer with a list of suggestions. Users can clic on one of the suggestions to replace the English word with the selected suggested word. The tool allows annotators to crop images and store annotated data in a CSV format.

## Installation

To run the app, clone this repository and run the following commands: <br />

``` npm install ``` to install the required packages.

``` npm run start ``` to run the dev server.

## Prerequisites

Make sure you have Node.js in your computer.

``` node --version ``` should give an output similar to this in the terminal:

![image](https://github.com/Fuse-Internship/Annotation-Tool---WebApp/assets/51270026/38a6678b-0b14-45a9-a98d-d9287aa07591)



## Usage

To use the tool, follow these steps:

1. Click on the “Select Folder” icon to choose the folder containing the images to annotate.
2. Use the previous/next buttons to navigate through the images and annotate them.
3. Click on the “Save” button to save the annotations.
4. The annotated data will be stored in CSV format along with the original image and the cropped image
