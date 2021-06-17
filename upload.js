
var fs = require('fs');
var request = require('request');
const Stream = require('stream')
var wav = require('wav');
var record = require('node-mic-record')
var fs = require('fs')
var FileWriter = require('wav').FileWriter;
var mic = require('mic'); // requires arecord or sox, see https://www.npmjs.com/package/mic
var AudioBuffer = require('web-audio-api').AudioBuffer
 
setInterval(test, 6000);

function test(){
  fs.unlinkSync("test.wav");
  var micInstance = mic({
    rate: '16000',
    channels: '1',
    debug: true
  });

  var micInputStream = micInstance.getAudioStream();
  var outputFileStream = new wav.FileWriter("test.wav", {
    sampleRate: 16000,
    channels: 1
  });
   
  micInputStream.pipe(outputFileStream);
   
  micInstance.start();
   
  setTimeout(function() {
    micInstance.stop();
    fs.copyFile('test.wav', 'buf.wav', (err) => {
      if (err) throw err;
      console.log('buf');
    });
    requestBirdnetApi(fs.createReadStream("buf.wav"), function (req, res, next) { });
    console.log("a")
  }, 5000);
}





var count = 0;

//setInterval(run, 1000);

requestBirdnetApi = function (stream, returnFunction) {
  //console.log(stream);

  var data = {
    upload: stream,
    meta: "{\"deviceId\":\"6668948700\",\"appVersion\":\"1.83\",\"ts\":1616790316034,\"author\":{\"name\":\"\",\"email\":\"\"},\"recordingId\":15,\"gps\":{\"lat\":52.379189,\"lon\":4.899431,\"alt\":1},\"city\":\"\",\"eBird_threshold\":0.05999999865889549,\"week\":0,\"os\":\"Android\",\"sensitivity\":1.25}"
  };

  const options = {
    method: "POST",
    url: "https://birdnet.cornell.edu/api2/upload",
    port: 443,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    formData: data
  };

  request(options, function (err, res, body) {
    if (err) {
      console.log(err);
      returnFunction(err);
    }
    console.log(JSON.parse(body));
    returnFunction(body);
  });

}

function run() {
  console.log(count++);
  requestBirdnetApi(fs.createReadStream("testcrop.wav"), function (req, res, next) { });
}


/*
#region
const form_data = new FormData();
form_data.append("file", fs.createReadStream("testcrop.wav"));



axios.post('https://birdnet.cornell.edu/api/upload', form_data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
}).then((response) => {
    console.log(response);
});

requestBirdnetApi = function (stream, returnFunction) {
  console.log(stream);

  var data = {
    upload: stream,
    meta: "{\"deviceId\":\"6668948700\",\"appVersion\":\"1.83\",\"ts\":1616790316034,\"author\":{\"name\":\"\",\"email\":\"\"},\"recordingId\":15,\"gps\":{\"lat\":52.379189,\"lon\":4.899431,\"alt\":1},\"city\":\"\",\"eBird_threshold\":0.05999999865889549,\"week\":0,\"os\":\"Android\",\"sensitivity\":1.25}"
  };

    const options = {
      method: "POST",
      url: "https://birdnet.cornell.edu/api2/upload",
      port: 443,
      headers: {
          "Content-Type": "multipart/form-data"
      },
      formData : data
  };


  axios.interceptors.request.use(req => {
    console.log(req.headers)
    console.log(req.data)
    return req;
  });

  axios.post('https://birdnet.cornell.edu:443/api2/upload', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then((response) => {
    console.log(response);
  }).catch((response) => {
    console.log(response);
  })

}
*/
