// -------------------------------------------------------------- \\
//            This file will return an image taken from the       \\
//                     raspberry pi camera module                 \\
// -------------------------------------------------------------- \\

// Import required modules
var express = require('express');
var router = express.Router();
const { exec } = require('child_process');

// Define the command to capture an image using the Raspberry Pi camera
const COMMAND = `raspistill -t 1 -ex auto -awb auto -fli auto -ifx denoise -n -o /run/pen.jpg`;

// Define the maximum number of retries if capturing an image fails
const RETRY_LIMIT = 3;

// Define the delay before retrying to capture an image (in milliseconds)
const RETRY_DELAY = 1000;

// Define a route handler for GET requests
router.get('/', function (req, res, next) {
  // Define a function to capture an image and retry if it fails
  const runCapture = (retryCount = 0) => {
    return new Promise((resolve, reject) => {
      // Execute the command to capture an image
      exec(COMMAND, (err) => {
        // If an error occurred
        if (err) {
          // Log the error
          console.error(`Error taking picture: ${err}`);
          // If the error message indicates that the camera could not be acquired
          if (err.message.includes('failed to acquire camera')) {
            // Log a message suggesting possible solutions
            console.error('Failed to acquire camera. Please check if the camera module is properly connected and enabled, and the cam is not locked.');
          }
          // If the retry limit has not been reached
          if (retryCount < RETRY_LIMIT) {
            // Log a message indicating that the function will retry after a delay
            console.log('Retrying after 1 second...');
            // Wait for the delay, then retry the function
            setTimeout(() => runCapture(retryCount + 1).then(resolve).catch(reject), RETRY_DELAY);
          } else {
            // If the retry limit has been reached, reject the promise with the error
            reject(err);
          }
        } else {
          // If the command was successful, resolve the promise
          resolve();
        }
      });
    });
  };

  // Run the function to capture an image
  runCapture()
    // If the function was successful, log a message indicating that the picture was taken
    .then(() => console.log('Picture taken'))
    // If an error occurred, log the error
    .catch(err => console.error('Error: ', err))
    // Finally, send the captured image as a response
    .finally(() => res.sendFile(`/run/pen.jpg`));
});

// Export the router
module.exports = router;
