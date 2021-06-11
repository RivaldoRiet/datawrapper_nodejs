const {spawn} = require('child_process');
const { json } = require('express');
const pyproc = spawn('python', ["recorder.py"])
const axios = require('axios').default;

const SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');

const port = new SerialPort('COM6'); // open Serial Port
const parser = port.pipe(new ReadLine({ delimiter: '\r\n' })) //Open Serial stream delimited by \r\n

const towerURN = "urn:test.faunatoren.test.hok.test1";

var sensorInit = true; //is sensor Initialising

var sensorTypes; //Array of sensortypes
var sensorBuff; //Sensor data Buffer

var birdBuff;

setInterval(sendSensorData, 1000) //Set Sending interval Every Second



parser.on('data', function (data) {
    
    var sensordata = new Object(); 
    //console.log(data)
    if (data.includes(",")){
        dataArray = data.split(",")
        if (sensorInit)
        {
            sensorInit = false;
            sensorTypes = dataArray; // Define Sensortypes 
            return;
        }
        //Write Data to respective key
        sensorTypes.forEach((element, index) => {
            sensordata[element] = dataArray[index];
        });

        //console.log(sensordata)
        sensorBuff = sensordata; //Wrire data to Buffer
    }   
  });

function sendSensorData(){

    var metadata = new Object();

    metadata.timestamp = Math.floor(+new Date() / 1000); //get Time
    metadata.id = towerURN; // Set URN

    var buffer = {...metadata ,...sensorBuff, ...birdBuff}// Combine DataBuffers 
    axios.post("https://tst-gravitee-gateway.dataplatform.nl/lab/1.0/faunatoren", buffer, 
    {
        headers: {
            'Content-Type' : 'application/json',
            'X-Gravitee-Api-Key': '24e0586f-175d-44b5-8fa5-24579736497b'
        }
    }
    ).then((response) => {
        console.log(response);
    });
}

function jsonData(birdArray)
{
    myObj = new Object() //Instantiate object
    var listOfObjects = [];
    for(var i = 0; i < birdArray.length; i++) {
        val = new Object()
        val[birdArray[i].split(";")[0]] = birdArray[i].split(";")[1];
        listOfObjects.push(val);
    }
    myObj.birdnet = listOfObjects;
    birdBuff = myObj;

    
}

pyproc.stdout.on('data', (data) => {
    
    if (data.indexOf('\[') !== -1 || data.indexOf('[') !== -1) {
        var mySubString = data.toString().substring(
            data.lastIndexOf("[") - 1, 
            data.lastIndexOf("]") + 1
        );

        if (IsJsonString(mySubString)) {
            console.log("JSON DETECTED");
            var birdData = JSON.parse(mySubString.toString());
            console.log(birdData);
            jsonData(birdData);
            console.log("JSON made");
        }
    } else {
        console.log(data.toString());
    }
})

function IsJsonString(str) {
    try {
        JSON. parse(str);
    } catch (e) {
        return false;
    }
    return true;
}