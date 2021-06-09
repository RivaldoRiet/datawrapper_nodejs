const {spawn} = require('child_process');
const { json } = require('express');
const pyproc = spawn('python', ["recorder.py"])
const axios = require('axios').default;

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

    axios.post("https://tst-gravitee-gateway.dataplatform.nl/lab/1.0/faunatoren", myObj, 
    {
        headers: {
            'Content-Type' : 'application/json',
            'X-Gravitee-Api-Key': '24e0586f-175d-44b5-8fa5-24579736497b'
        }
    }
).then((response) => {
    console.log(response);
})
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