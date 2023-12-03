/***********************************************************************************\
/                                      TO:DO                                        \
/***********************************************************************************\
 * 
 *  - Ensure image is loaded properly before running the model (possibly not waiting long enough for fs?)
 *  - Retrain a better model that might actually work and have less false positives. (Maybe train with support for sobel filter?)
 * 
 */
// ------------------------------------------------------------------------------- \\
//                                  Definitions                                    \\
// ------------------------------------------------------------------------------- \\

// Basic definitions
let model;
let image;
const modelUrl = '/models/v2/model.json';
const { canvas: canvas1, context: ctx1 } = getCanvasAndContext('canvas1');
const { canvas: canvas2, context: ctx2 } = getCanvasAndContext('canvas2');

// Define options for running the prediction
const options = {
    score: 0.6,
    iou: 0.5,
    topk: 20
};

// ------------------------------------------------------------------------------- \\
//                                  Functions                                      \\
// ------------------------------------------------------------------------------- \\

// Define the canvas and context
function getCanvasAndContext(id) {
    const canvas = document.getElementById(id);
    const context = canvas.getContext('2d');
    return { canvas, context };
}

// Define the log object with messages as a property
const log = {
    // Array to store log messages
    messages: [],

    // Method to log informational messages
    info: function (message) {
        // Log the message to the console
        console.log(message);
        // Add the message to the messages array with an "INFO" prefix
        this.messages.push(`INFO: ${message}`);
        // Update the 'log' element in the HTML to display the updated messages
        document.getElementById('log').value = this.messages.join('\n');
    },

    // Method to log error messages
    error: function (message) {
        // Log the error message to the console
        console.error(message);
        // Add the error message to the messages array with an "ERROR" prefix
        this.messages.push(`ERROR: ${message}`);
        // Update the 'log' element in the HTML to display the updated messages
        document.getElementById('log').value = this.messages.join('\n');
        // Update the color of the 'log' element
        this.color('red');
    },

    // Method to log warning messages
    warn: function (message) {
        // Log the warning message to the console
        console.warn(message);
        // Add the warning message to the messages array with a "WARN" prefix
        this.messages.push(`WARN: ${message}`);
        // Update the 'log' element in the HTML to display the updated messages
        document.getElementById('log').value = this.messages.join('\n');
    },

    color: function (color) {
        // Change the color of the element with the id 'log'
        document.getElementById('log').style.color = color;
    },

    clear: function () {
        // Reset the log color
        log.color('#3498db');
        
        // Clear the messages array and the 'log' element in the HTML
        this.messages = [];

        // Update the 'log' element in the HTML to display the updated messages
        document.getElementById('log').value = '';
    }
};

async function initialize() {
    // Get the image and canvas elements
    const image = document.getElementById('source');
    const canvas1 = document.getElementById('canvas1');
    const ctx1 = canvas1.getContext('2d');

    // Hide the loading spinner and show content
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('content').style.display = '';

    // Set canvas data    
    canvas1.width = image.width;
    canvas1.height = image.height;

    // Draw the image to the canvas
    try {
        ctx1.drawImage(image, 0, 0);
    } catch {
        log.error('Failed to draw image to canvas, check if the folder /images exists and if picam is working...');
        return false;
    }

    // Load the model
    log.info('Fetching model...');
    try {
        model = await tf.automl.loadObjectDetection(modelUrl);
        log.info('Model loaded!');
    } catch (err) {
        log.error('Failed to load model, check if the model exists and if the model is valid...');
        console.log(err);
        return false;
    }

    // No errors occurred
    return true;
}

async function runModel() {
    // Log that we're using the cached model
    log.info('Using cached model...');

    // Log that we're starting detection
    log.info('Detecting...');

    // Wait for the model to load and run prediction
    return await (await model).detect(image, options);
}

function greyscale() {
    const imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
    const d = imgData.data;
    const PIXEL_STEP = 4; // Each pixel is 4 values (r, g, b, a)

    // Loop through all pixels
    for (let i = 0; i < d.length; i += PIXEL_STEP) {
        // Calculate the average of the r, g, b values
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;

        // Set r, g, b values to the average (greyscale)
        d[i] = d[i + 1] = d[i + 2] = avg;
    }

    // Redraw the new computed image
    ctx1.putImageData(imgData, 0, 0);

    // Set the source to allow the model to process the greyscale image
    image = canvas1;
}

// Function to draw a rectangle on a context
function drawRect(context, box, color = 'red') {
    context.beginPath();
    context.rect(box.left, box.top, box.width, box.height);
    context.lineWidth = 2;
    context.strokeStyle = color;
    context.stroke();
}

function grabPrediction(prediction) {
    console.log(prediction);

    // Get the first object's box
    const box = prediction[0]?.box;

    // Check if the box property exists
    if (!box) {
        log.error('Failed to detect plate');
        return;
    } else {
        log.color('green');
    }

    // Draw the rectangle on the first canvas
    drawRect(ctx1, box);

    // Draw the zoomed-in area on the second canvas
    ctx2.drawImage(image, box.left, box.top, box.width, box.height, 0, 0, canvas2.width, canvas2.height);
}
// Reset for rerun of detection
// Reset the log is all that is required (for now...)
const reset = () => log.clear();

// Define an asynchronous function to fetch a new image
async function fetchNewImage() {
    // Create a new image object
    const image = new Image();
    // Set the source of the image to the API endpoint, appending the current time to prevent caching
    image.src = `/api/realtime?time=${Date.now()}`;

    try {
        // Wait for the image to load
        await new Promise((resolve, reject) => {
            // When the image loads, resolve the promise
            image.onload = resolve;
            // If an error occurs while loading the image, reject the promise
            image.onerror = reject;
        });

        // Set the width and height of the canvas to match the image
        canvas1.width = image.width;
        canvas1.height = image.height;

        // Draw the image onto the canvas at the top-left corner
        ctx1.drawImage(image, 0, 0);
    } catch (err) {
        // If an error occurred at any point in the process, log the error
        log.error('Error fetching new image:', err);
    }
}
// ------------------------------------------------------------------------------- \\
//                                   Main Loop                                     \\
// ------------------------------------------------------------------------------- \\

async function loop() {
    log.info('Starting process...');

    // Reset the playing field without erasing the canvas2
    reset();

    // Get the greyscale image data and send it to the canvas
    greyscale();

    // Run detections and all that jazz
    log.info('Running model...');
    const prediction = await runModel();
    log.info('Done detecting');

    // Write the canvas2 stuffs and get the prediction
    grabPrediction(prediction);
    log.info('Done processing!');

    // Fetch new image
    log.info('Fetching new image...');
    await fetchNewImage();
    log.info('Done resetting');

    // Run loop
    loop();
}

// ------------------------------------------------------------------------------- \\
//                                  Page Load                                      \\
// ------------------------------------------------------------------------------- \\

// Wait for page to load completely
window.onload = async () => {
    // Do one time initializations on page load
    if (await initialize()) // Continue unless an error occurred
        loop(); // Main loop
};