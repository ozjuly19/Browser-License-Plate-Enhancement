// ------------------------------------------------------------------------------- \\
//                                  Definitions                                    \\
// ------------------------------------------------------------------------------- \\


// Get the canvases and their contexts
const canvas1 = document.getElementById('canvas1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');

let image;

// Define the model URL
const modelUrl = '/models/v2/model.json';

// ------------------------------------------------------------------------------- \\
//                                  Functions                                      \\
// ------------------------------------------------------------------------------- \\

// Add each log message to a array and return them all at once
// let y = 30;
let messages = [];
function log(message) {
    console.log(message);
    messages.push(message);
    document.getElementById('log').value = messages.join('\n');

    // // Draw the log text
    // ctx1.fillStyle = 'white';
    // ctx1.font = '20px Arial';
    // ctx1.fillText(message, 10, y);
    // y += 30; // Adjust this value to change the line spacing
}

// Call this to change the color of the log element
function changeLogColor(color) {
    document.getElementById('log').style.color = color;
}

function initalize() {
    // Get the image
    image = document.getElementById('source');

    // Hide the loading spinner
    document.getElementById('spinner').style.display = 'none';

    // Show content
    document.getElementById('content').style.display = '';

    // Set canvas data    
    canvas1.width = image.width;
    canvas1.height = image.height;

    // Draw the image to the canvas
    try {
        ctx1.drawImage(image, 0, 0);
    } catch { // Error occured likely no image was passed to the source element
        changeLogColor('red');
        log('Failed to draw image to canvas, check if the folder /images exists and if picam is working...');
        return false;
    }

    // No errors occured
    return true;
}

async function runModel() {
    // load example image and run prediction
    // const image = await loadImage(passedImage)
    log('Fetching model...');
    const model = await tf.automl.loadObjectDetection(modelUrl);
    await log('Got model');

    const options = {
        score: 0.4,
        iou: 0.5,
        topk: 20
    };

    log('Detecting...');

    return await model.detect(image, options);
}

function greyscale() {
    const imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);

    var d = imgData.data;
    // loop through all pixels
    // each pixel is decomposed in its 4 rgba values
    for (var i = 0; i < d.length; i += 4) {
        // get the medium of the 3 first values ( (r+g+b)/3 )
        var med = (d[i] + d[i + 1] + d[i + 2]) / 3;
        // set it to each value (r = g = b = med)
        d[i] = d[i + 1] = d[i + 2] = med;
        // we don't touch the alpha
    }
    // redraw the new computed image
    ctx1.putImageData(imgData, 0, 0);

    // Set the source to allow the model to procees the greyscale image
    image = canvas1;
}

function grabPrediction(prediciton) {
    console.log(prediciton);

    // Get the first object's box
    const box = prediciton[0]?.box;

    // Check if the box property exists
    if (!box) {
        log('Failed to detect plate');
        changeLogColor('red');
        return;
    } else {
        changeLogColor('green');
    }

    // Define a zoom factor
    // const zoomFactor = 4;

    // Draw the image and the rectangle on the first canvas, and the zoomed-in area on the second canvas, when the image is loaded
    // Draw the rectangle
    ctx1.beginPath();
    ctx1.rect(box.left, box.top, box.width, box.height);
    ctx1.lineWidth = 2;
    ctx1.strokeStyle = 'red';
    ctx1.stroke();

    // Draw the zoomed-in area on the second canvas
    ctx2.drawImage(image, box.left, box.top, box.width, box.height, 0, 0, canvas2.width, canvas2.height);

    // Draw the zoomed-in area on the second canvas
    ctx2.drawImage(image, box.left, box.top, box.width, box.height, 0, 0, canvas2.width, canvas2.height);
}

// Reset for rerun of detection
function reset() {
    // Reset the log
    messages = [];
    document.getElementById('log').value = '';

    // Reset the log color
    changeLogColor('#3498db');

    // Reset the log y position
    // y = 30;
}

async function fetchNewImage() {
    // Draw to the canvas with the image fetched from /api/take-image
    const image = new Image();
    image.src = '/api/realtime?time=' + Date.now();
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    }).then(() => {
        // Set canvas data    
        canvas1.width = image.width;
        canvas1.height = image.height;

        ctx1.drawImage(image, 0, 0);
    }).catch(err => {
        console.log(err);
    });
}

// ------------------------------------------------------------------------------- \\
//                                   Main Loop                                     \\
// ------------------------------------------------------------------------------- \\

async function loop() {
    // Reset the playing field without erasing the canvas2
    reset();

    log('Staring process...');

    // get the greyscale image data and send it to the canvas
    greyscale();

    // Run detections and all that jazz
    const prediciton = await runModel();

    log('Done detecting');

    // Write the canvas2 stuffs and get the prediction
    grabPrediction(prediciton);

    log('Done processing!');

    log('Resetting...')

    await fetchNewImage();

    // Run loop
    loop();

}

// ------------------------------------------------------------------------------- \\
//                                  Page Load                                      \\
// ------------------------------------------------------------------------------- \\

// Wait for page to load completely
window.onload = () => {
    // Do one time initalizations on page load
    if (initalize()) // Continue unless an error occured
        loop(); // Main loop
};