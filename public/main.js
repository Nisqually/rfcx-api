window.AudioContext = window.AudioContext || window.webkitAudioContext;
context = new AudioContext();

function process(Data) {
    source = context.createBufferSource(); // Create Sound Source
    context.decodeAudioData(Data, function(buffer){
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(context.currentTime);
    });
};

function loadSound() {
    var request = new XMLHttpRequest();
    request.open("GET", "/v1/events/49d540e6-c0ba-4819-9011-2bdfe9688883.m4a", true);
    request.responseType = "arraybuffer";

    request.onload = function() {
        var Data = request.response;
        process(Data);
    };

    request.send();
};

loadSound()