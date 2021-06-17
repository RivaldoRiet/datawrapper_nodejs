var soundfile;
var seconds = 0;
var current_analysis;
var current_ctx;
var current_spec = 0;
var hasIntervalMarker = false;
var barChart;
var bbox_left = 0;
var bbox_draw_allowed = false;
var bbox_allow_request = false;
var bbox_start = 0;
var bbox_end = 0;

////////////////////////////  ANALYSIS ///////////////////////////////
function showFileAnalysis(analysis) {

    //clear content
    $("#content").empty();

    // Add spectrogram view
    $("#content").append("<div class='noselect' id='spec-container'><img id='spec' /></div>");
    $("#spec").attr('src', 'data:image/png;base64,' + analysis.spec);
    $("#content").append("<div id='playerMarker'></div>");
    $("#playerMarker").hide();

    // Add onClick for spec view
    $('#spec').mousedown(function(e)
    {
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();

        var left = Math.round( (e.clientX - offset_l) );
        var top = $("#spec").position().top;

        var spec_w = $("#spec").width();
        var playTime = left * analysis.seconds / spec_w;

        document.getElementById("player").currentTime = playTime;
        setBoundingBox(0, top, left + $("#spec").position().left);

    });
	/*
    // Set mousemove for bounding box
    $('#spec').mousemove(function(e)
    {
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();

        var left = Math.round( (e.clientX - offset_l) );
        var top = $("#spec").position().top;

        setBoundingBox(1, top, left + $("#spec").position().left);

    });

    // Set mouseup for bounding box
    $('#spec').mouseup(function(e)
    {
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();

        var left = Math.round( (e.clientX - offset_l) );
        var top = $("#spec").position().top;

        setBoundingBox(2, top, left + $("#spec").position().left);

    });
	*/

    //Show player
    $("#content").append("<audio controls id='player' ontimeupdate='setPlayerMarker();'></audio>");
    var $audio = $('#player');
    $audio.attr('src', soundfile);
    $audio.ontimeupdate = function() {setPlayerMarker();};
    seconds = analysis.seconds;

    // Add chart headline
    $("#content").append("<div id='chart-headline'>This chart shows the average species probabilities for the entire file. Play the file or click the spectrogram for interval scores.</div>");

    // Add chart canvas
    $("#content").append("<div id='chart-container'><canvas id='analysis-chart'></canvas></div>");
    var ctx = document.getElementById("analysis-chart").getContext('2d');

	var pheight = $("#player").height();
    $("#chart-headline").css('top', 150 + pheight);
    $("#chart-container").css('top', 150 + 40 + pheight);

    // Plot overall predictions
    plotPrediction(analysis.prediction[0], ctx);

    // Add statistics Bar
    var s = "Prediction took " + Number((parseFloat(analysis.time)).toFixed(2)) + " seconds";// for " + analysis.spec_count + " spectrograms";
    //s += " (" + analysis.spec_length + " seconds length, " + analysis.spec_overlap + " seconds overlap)"
    $("#content").append("<div id='statistics'>" + s + "</div>")

    // Save as global var
    current_analysis = analysis;
    current_ctx = ctx;
    hasIntervalMarker = false;

    // Set intervalMarker?
    if (!hasIntervalMarker) setIntervalMarker();

}

function plotPrediction(prediction, ctx) {

    //Destroy old chart
    if (barChart) barChart.destroy();

    // Parse result
    var labels = [];
    var scores = [];
    var p_keys = Object.keys(prediction);
    for (var i = 0; i < p_keys.length; i++) {

        var species = prediction[p_keys[i]].species;
        var score = parseFloat(prediction[p_keys[i]].score);

        if ((score >= 0.05 || labels.length < 10) && species.split(';')[0] != 'Noise') {
            if (species.split(';')[0] == 'Other' || species.split(';')[0] == 'Human' || species.split(';')[0] == 'Unknown Species') labels.push(species.split(';')[0]);
            else labels.push([species.split(';')[0], '(' + species.split(';')[1] + ')']);
            scores.push(score);
        }

        if (scores.length >= 10) break;

    }

    //Bar chart data
    var data = {
        labels: labels,
        datasets: [{
            label: 'Species probability',
            data: scores,
            backgroundColor: 'rgba(0, 191, 255, 0.5)',
            borderColor: 'rgba(0, 172, 229, 1)',
            borderWidth: 2
        }]
    };

    // Bar chart options
    var options = {
        scales: {
            xAxes: [{
                ticks: {
                    //beginAtZero:true,
                    max: 1,
                    min: 0,
                    stepSize: 0.05
                }
            }],
            yAxes: [{
              afterFit: function(scaleInstance) {
                  scaleInstance.width = 175; // sets the width to 100px
              }
            }]
        },
        layout: {
            padding: {
                left: 20,
                right: 50,
                top: 10,
                bottom: 10
            }
        },
        legend: {
            display: false
         },
        responsive: true,
        maintainAspectRatio: false,
        animation: false
    };

    // Add chart
    barChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: data,
        options: options
    });

}

function setBoundingBox(mode, top, left) {

    //BBox end
    if (mode == 2 && Math.abs(left - bbox_left) >= $("#spec").width() * 0.01) {

        //Finalize BBox
        bbox_draw_allowed = false;
        bbox_start = $("#bbox").position().left - $("#spec").position().left;
        bbox_end = bbox_start + $("#bbox").width();

        var from = bbox_start / $("#spec").width() * current_analysis.seconds;
        var to = bbox_end / $("#spec").width() * current_analysis.seconds;

        // Send analysis request
        if (bbox_allow_request && (to - from) >= 1) {

            analyzeBBox(from, to);
            bbox_allow_request = false;

        }

        if (to - from < 1) {

            $("#bbox").hide();

        }


    // BBOX move
    } else if (mode == 1) {

        // Set bbox if move was large enough
        if (Math.abs(left - bbox_left) >= $("#spec").width() * 0.01 && bbox_draw_allowed) {

            $("#bbox").css({'width': Math.abs(left - bbox_left)});
            $("#bbox").show();

            if (left < bbox_left) $("#bbox").css({'left': bbox_left - Math.abs(left - bbox_left)});

        }

    // BBox start
    } else {

        // Hidden BBox
        bbox_left = left;
        if (!$("#bbox").length) $("#content").append("<div id='bbox'></div>");
        $("#bbox").css({'left': left});
        $("#bbox").css({'top': top});
        $("#bbox").mouseup(function(e) {
            setBoundingBox(2, 0, 0);
        });
        $('#bbox').mousemove(function(e)
        {
            var offset_t = $(this).offset().top - $(window).scrollTop();
            var offset_l = $(this).offset().left - $(window).scrollLeft();

            var left = Math.round( (e.clientX - offset_l) ) + $("#bbox").position().left;
            var top = $("#spec").position().top;

            setBoundingBox(1, top, left);

        });
        $("#bbox").hide();
        bbox_draw_allowed = true;
        bbox_allow_request = true;

    }

}

function analyzeBBox(start, end) {

    // Prepare payload
    var json_array = {

        action: 'analyze',
        fileid: current_analysis.fileid,
        from: start,
        to: end

    };
    json_string = JSON.stringify(json_array);

    $('#chart-headline').text("Waiting for BBox prediction...");

    // Make request
    $.ajax({
        url: 'process',
        type: 'POST',
        data: typeof json_string === "string" ? "json=" + encodeURIComponent(json_string) : json_string,
        async: true,
        success: function (response) {

            jsonObj = JSON.parse(response);
            console.log(jsonObj.prediction[0]);

            plotPrediction(jsonObj.prediction[0], current_ctx);
            $('#chart-headline').text("Species probabilities for " + getTimestamp(Math.floor(start), Math.floor(end)) + " (BBox prediction):");

        },
        error: function (error) {


        }
    });

}

function setIntervalMarker() {

	/*

    // Get spec dims
    var spec_w = $("#spec").width();
    var spec_x = $("#spec").position().left;
    var spec_y = $("#spec").position().top;

    // Get times
    var times = current_analysis.spec_times;

    //Set marjer for each times
    for (var i = 2; i < times.length; i++) {

        var top = spec_y;
        var left = spec_x + (spec_w * (times[i] / current_analysis.seconds));
        var right = left + (spec_w * (current_analysis.spec_length / current_analysis.seconds));
        if (left > spec_x + spec_w) left = spec_x + spec_w;

        $("#content").append("<div class='intervalMarker' id='im_" + i + "'></div>");
        $("#im_" + i).css({'left': left});
        $("#im_" + i).css({'top': top});
        $("#im_" + i).mouseup(function(e) {
            bbox_allow_request = false;
            setBoundingBox(2, 0, 0);
        });

    }

    hasIntervalMarker = true;

	*/

}

function setPlayerMarker() {

    // Set intervalMarker?
    if (!hasIntervalMarker) setIntervalMarker();

    // Get current play time
    var t = document.getElementById("player").currentTime;

    // Get spec dims
    var spec_w = $("#spec").width();
    var spec_x = $("#spec").position().left;
    var spec_y = $("#spec").position().top;
    var top = spec_y;
    var left = spec_x + (spec_w * (t / seconds));
    if (left > spec_x + spec_w) left = spec_x + spec_w;

    // Set marker
    $("#playerMarker").css({'left': left});
    $("#playerMarker").css({'top': top});
    //$("#playerMarker").mouseup(function(e) {
    //    bbox_allow_request = false;
    //    setBoundingBox(2, 0, 0);
    //});
    $("#playerMarker").show();

    // Get prediction id for time
    var times = current_analysis.spec_times;
    times.push(Math.floor(current_analysis.seconds));
    var spec_id = 0;
    for (var i = 0; i < times.length; i++) {

        if (t <= times[i]) {

            spec_id = i - 1;
            break;

        }
    }

    // Plot prediction according to time
    if (spec_id != current_spec && spec_id > 0) {
        plotPrediction(current_analysis.prediction[spec_id], current_ctx);
        if (spec_id < times.length - 1) $('#chart-headline').text("Species probabilities for " + getTimestamp(times[spec_id], times[spec_id + 1]) + " (Spectrogram " + spec_id + "):");
        else $('#chart-headline').text("Species probabilities for " + getTimestamp(times[spec_id], current_analysis.seconds) + " (Spectrogram " + spec_id + "):");
        current_spec = spec_id;
    }

    //console.log(t + "/" + seconds + "/" + spec_w + " SPEC:" + spec_id);

}

function getTimestamp(start, end) {

    //console.log(start + ";" + end);

    return fancyTimeFormat(start) + ' min - ' + fancyTimeFormat(end) + ' min';

}

function fancyTimeFormat(time)
{
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

function displayMessage(m) {

    //clear content
    $("#content").empty();

    //Set message
    $("#content").append("<div class='message'>" + m + "</div>");

}

/////////////////////////  DO AFTER LOAD ////////////////////////////
$( document ).ready(function() {

    //set first status message
    displayMessage("No data available. Please upload an audio file...");

    //initialize upload functionality
    initUploadForm();

});

//////////////////////////  UPLOAD FORM  ///////////////////////////
function initUploadForm() {

    // Set onChanged-function
    $("#dummyinput").change(function(e){

        // Audio player
        var target = e.currentTarget;
        var file = target.files[0];

        if (target.files && file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                soundfile = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        loadFile();
    });

    // Upload file to server and get response
    $("#fileform").submit(function(evt){

        evt.preventDefault();
        var formData = new FormData($(this)[0]);

        // Show status
        displayMessage("File upload in progress...");

        $.ajax({
            url: 'upload',
            type: 'POST',
            data: formData,
            async: true,
            cache: false,
            contentType: false,
            enctype: 'multipart/form-data',
            processData: false,
            success: function (response) {
                jsonObj = JSON.parse(response);
                if (jsonObj.response == 'error') displayMessage("Sorry, something went wrong!");
                else uploadResponse(jsonObj);
            },
            error: function (error) {
                console.log(error);
                displayMessage("Sorry, something went wrong!");
            }
        });
        return false;
    });

}

function upload() {

    $('#dummyinput').trigger('click');

}

function loadFile() {

    //Set path in input
    var fileValue = ($('#dummyinput').val() !== "") ? $('#dummyinput').val().split("\\")[2] : 'No audio file selected...';
    if (fileValue != 'No audio file selected...') {
        $('#input-filename').val(fileValue);

        //Submit upload request
        $('#fileform').trigger('submit');
    }

}

function uploadResponse(r) {

    console.log(r);

    //success or error?
    if (r.response == 'success') {
        showFileAnalysis(r);
    } else {
        displayMessage("Sorry, something went wrong!" + "<br/>(" + r.msg + ")");
    }

}
