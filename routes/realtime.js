// -------------------------------------------------------------- \\
//            This file will return an image taken from the       \\
//                     raspberry pi camera module                 \\
// -------------------------------------------------------------- \\

var express = require('express');
var router = express.Router();

const { exec } = require('child_process');

/* GET home page. */
router.get('/', function (req, res, next) {

  // Take still image and save to disk
  const runCapture = () => {
    return new Promise((resolve, reject) => {
      try {
        exec(`rpicam-still -e png -t 0 --immediate -n 1 --vflip 1 --hflip 1 -o public/images/1.PNG`, (err, stdout, stderr) => {

          if (err) {
            console.log('Error taking picture: ' + err);
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.log('Error taking picture: ' + err);
        reject(err);
      }
    });
  };

  runCapture().then(() => {
    console.log('Picture taken');
  }).catch(err => {
    console.log('Error: ', err);
  }).finally(() => {
    res.sendFile(process.cwd() + '/public/images/1.PNG');
  });
});

module.exports = router;
