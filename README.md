# Introduction

This project is a simple license plate detection script that uses TensorflowJS to run an AutoML model on a given realtime image. The model will return coordinates on the input image to allow drawing of a bounding box or further image processing. NodeJS is the basic API and web host for my own sanity however, you could build this on whatever server you prefer (I'm just familiar with Node.)

# Workflow

## [index.html](public/index.html)
The index will call [realtime.js](routes/realtime.js) and await the realtime image. When the image is received it will be process by Tensorflow, and this entire section of the app is run in [public/](public/) which is client side only.

## [realtime.js](routes/realtime.js)
The images are gathered using the file [realtime.js](routes/realtime.js) temporarily saving the image to /run/pen.png or a tempfs of your choice. Make sure the user executing this node project has authority to save inside /run/ or you will face a permissions error.

# Important Notes:

* I'm assuming the use of a __TFT 3.5" screen__ attached to the RPI with the usage of a kiosk browser configuration. This will be reflected in the latest styling and structure of this project to fit the screen limitations.
* My future plan for this project is to implement __YOLO__ object detection to first hone in on specific vehicles then process that frame for license plates. The thought here is to avoid false positives that appear in this specific model [models/v2/](models/v2/) (which could also likely be solved by a better/wider dataset.)

# Legal Notice

__This project in its current or future form will NOT come pre-built with any systems allowing the operator to: determine the ownership of a motor vehicle, the mileage or route traveled by a motor vehicle, the location or identity of a motor vehicle, or the identity of a motor vehicle's occupants on public highways.__