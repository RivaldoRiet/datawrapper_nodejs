const SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');

const port = new SerialPort('COM6');
const parser = port.pipe(new ReadLine({ delimiter: '\r\n' }))

var sensorInit = true;

var sensorTypes;
var sensorBuff;
console.log("?????")


parser.on('data', function (data) {
    var sensordata = new Object();
    console.log(data)
    if (data.includes(",")){
        dataArray = data.split(",")
        if (sensorInit)
        {
            sensorInit = false;
            sensorTypes = dataArray;
            return;
        }
        sensorTypes.forEach((element, index) => {
            sensordata[element] = dataArray[index];
        });

        console.log(sensordata)
        
    }   
  });