// Converts image data to a 3D array for easier manipulation
function convertTo3DArray(pixels, imgHeight, imgWidth) {
  let originalImgData = [];
  for (let y = 0; y < imgHeight; y++) {
    originalImgData[y] = [];
    for (let x = 0; x < imgWidth; x++) {
      const index = (y * imgWidth + x) * 4;
      originalImgData[y][x] = [
        pixels[index], // Red
        pixels[index + 1], // Green
        pixels[index + 2], // Blue
        pixels[index + 3], // Alpha
      ];
    }
  }
  return originalImgData;
}

// Helper for Initializing scaled image data array with transparent pixels
function fillWithTransparentPixels(newWidth, newHeight) {
  return Array.from({ length: newHeight }, () =>
    Array.from({ length: newWidth }, () => [0, 0, 0, 0])
  );
}

// Helper function to compare two pixel arrays
function arraysEqual(arr1, arr2) {
  return (
    arr1.length === arr2.length &&
    arr1.every((value, index) => value === arr2[index])
  );
}

// Fills scaledImgNNData with 2x nearest neighbor filter.
function nearestNeighborScale(
  originalHeight,
  originalWidth,
  imageToBeScaled,
  originalImgData
) {
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      imageToBeScaled[x * 2][y * 2] = originalImgData[x][y];
      imageToBeScaled[x * 2 + 1][y * 2] = originalImgData[x][y];
      imageToBeScaled[x * 2][y * 2 + 1] = originalImgData[x][y];
      imageToBeScaled[x * 2 + 1][y * 2 + 1] = originalImgData[x][y];
    }
  }
  return imageToBeScaled;
}

function applyBilinearScale(
  newWidth,
  newHeight,
  originalWidth,
  originalHeight,
  originalImgData
) {
  scaledImg = fillWithTransparentPixels(newWidth, newHeight);

  // Interpolates in X direction
  for (let x = 0; x < originalWidth - 1; x++) {
    for (let y = 0; y < originalHeight; y++) {
      for (let channel = 0; channel < 4; channel++) {
        scaledImg[y * 2][x * 2][channel] = originalImgData[y][x][channel];
        scaledImg[y * 2][x * 2 + 1][channel] =
          (originalImgData[y][x][channel] + originalImgData[y][x + 1][channel]) / 2;
      }
    }
  }

  // Interpolates in Y direction
  for (let x = 0; x < newWidth; x++) {
    for (let y = 1; y < newHeight - 1; y+=2) {
      for (let channel = 0; channel < 4; channel++) {
        scaledImg[y][x][channel] = (scaledImg[y - 1][x][channel] + scaledImg[y + 1][x][channel]) / 2;
      }
    }
  }

  return scaledImg;
}

function convert3DArrImgTo1D(context, width, height, img3DArrToConvert) {
  let oneDArrayImg = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      oneDArrayImg.data[index] = img3DArrToConvert[y][x][0];
      oneDArrayImg.data[index + 1] = img3DArrToConvert[y][x][1];
      oneDArrayImg.data[index + 2] = img3DArrToConvert[y][x][2];
      oneDArrayImg.data[index + 3] = img3DArrToConvert[y][x][3];
    }
  }

  return oneDArrayImg;
}

document
  .getElementById("imageInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let canvas = document.getElementById("nearestNeighbor");
          let context = canvas.getContext("2d");

          let newWidth = img.width * 2;
          let newHeight = img.height * 2;
          canvas.width = newWidth;
          canvas.height = newHeight;

          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data;

          let originalImgData = convertTo3DArray(pixels, img.height, img.width);
          let scaledImgNNData = fillWithTransparentPixels(newWidth, newHeight);
          scaledImgNNData = nearestNeighborScale(
            img.height,
            img.width,
            scaledImgNNData,
            originalImgData
          );
          // JS canvas can only draw the image if it is in a 1D array
          let scaledNN1DImg = convert3DArrImgTo1D(
            context,
            newWidth,
            newHeight,
            scaledImgNNData
          );
          context.putImageData(scaledNN1DImg, 0, 0);

          canvas = document.getElementById("bilinearScaled");
          context = canvas.getContext("2d");
          canvas.width = newWidth;
          canvas.height = newHeight;
          let bilinearImg = applyBilinearScale(
            newWidth,
            newHeight,
            img.width,
            img.height,
            originalImgData
          );
          let bilinear1DImg = convert3DArrImgTo1D(
            context,
            newWidth,
            newHeight,
            bilinearImg
          );
          context.putImageData(bilinear1DImg, 0, 0);
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  });
