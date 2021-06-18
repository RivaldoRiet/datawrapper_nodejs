var fs = require('fs');
var request = require('request');
const Stream = require('stream')
var record = require('node-mic-record')
var fs = require('fs')
var FileWriter = require('wav').FileWriter;
// requires arecord or sox, see https://www.npmjs.com/package/mic
var AudioBuffer = require('web-audio-api').AudioBuffer
let Mic = require('node-microphone');
var wav = require('wav');
var mic = require('mic');

//setInterval(test, 10000);
//setInterval(function(){requestBirdnetApi(fs.createReadStream("meral.wav"), function(){})}, 1000)


test();
function test() {
  var wav = require('wav');
  var mic = require('mic');
  fs.unlinkSync("test.wav");
  var micInstance = mic({
    rate: '16000',
    channels: '1',
    debug: false,
    device: 'plughw:2,0'
  });

  var micInputStream = micInstance.getAudioStream();
  var outputFileStream = new wav.FileWriter("test.wav", {
    sampleRate: 16000,
    channels: 1
  });

  micInputStream.pipe(outputFileStream);

  micInstance.start();

  setTimeout(function () {
    micInstance.stop();
    //console.log("endrec")
    fs.copyFile('test.wav', 'buf.wav', (err) => {
      if (err) throw err;
      requestBirdnetApi(fs.createReadStream("buf.wav"), function (req, res, next) { });
      //setTimeout(test, 1000)
    })

    //console.log("a")
  }, 10000);
}


function requestBirdnetApi(stream, returnFunction) {
  //console.log(stream);

  var data = {
    upload: stream,

  };

  const options = {
    method: "POST",
    url: "https://birdnet.cornell.edu/api/upload",
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
    //console.log(body);
    var preds = JSON.parse(res.body).prediction[0]
      var birdnet = [];
      for (const [key, value] of Object.entries(preds)) {
        if (parseFloat(value.score) > 0.50) {
          var predict = new Object()
          predict[value.species.split(';')[0]] = parseFloat(value.score)
          birdnet.push(predict);
        }

      }
      var testobj = new Object()
      testobj["birdnet"] = birdnet
      console.log(JSON.stringify(testobj))
      returnFunction(body);
      
      setTimeout(test, 1000);
    
    
    //console.log(preds)



  });

}