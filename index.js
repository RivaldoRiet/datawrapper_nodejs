const {spawn} = require('child_process');
const { json } = require('express');
const pyproc = spawn('python', ["recorder.py"])

function jsonData(birdArray)
{
    myObj = new Object()
    myObj.timestamp = Math.floor(+new Date() / 1000);
    myObj.id = "nodejs";
    myObj.tripwire = true;
    myObj.activity = 3.1400001;
    myObj.lichtwaarde = 255;
    var listOfObjects = [];
    for(var i = 0; i < birdArray.length; i++) {
        val = new Object()
        val[birdArray[i].split(";")[0]] = birdArray[i].split(";")[1];
        listOfObjects.push(val);
    }

    myObj.birdnet = listOfObjects;
    console.log(myObj);
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