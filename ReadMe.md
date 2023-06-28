## This project was implemented as a part of my bachelor thesis.
Goal was the implementation of an intelligent wateringsystem based on LoRaWAN.

### Implementation
#### Frontend
The Frontend was implemented with Embedded JavaScript (EJS) and Bootstrap.

#### Backend
The Backend was implemented with Node.js, Express.js and TypeScript.

#### DB and WebHost
As database MongoDB was used and the WebHost is Render.com.
The Webapp also uses The Things Network.

### Hardware
The Webapp reads the names of the userdata and therfore only works with specific sensors. Following hardware should be used:
Distance sensor: Milesight EM310-UDL (868MHz)
Soil moisture sensor: Dragino LSE01 (868MHz)

As hardware controlling unit, the Seeeduino LoRaWAN is used.
