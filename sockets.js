const BaseUrl = require('./BaseUrl');
const socket = require('socket.io-client')(BaseUrl);
const gpioInterface = require("./gpio");

const _channel = "machine";

// Make pins object for future use
const pins = {};
// Get a PIN object for GPIO 18 with direction 'out'
pins[18] = gpioInterface.getPIN(18, 'out');
// power 'off' the GPIO 18
gpioInterface.usePin(pins[18], 0);

// Used to keep intervalId, globally
let intervalId = null;

// The state object to keep user and timer
let state = { user: null, timer: null };

socket.on('connect', function () {
    // registering machine as active
    const { timer } = state;
    socket.emit("registerMachine", { _channel, timeObj: timer });
    console.log("emitting accessibility status");
});

socket.on('ping', function(payload) {
    const { channel } = payload;
    if(channel == _channel) {
        const { timer } = state;
        socket.emit("registerMachine", { _channel, timeObj: timer });
    }
});

// Listening for machine start event from server
socket.on('turn_machine_on', (payload) => {
    const { channel, user, cycle_time } = payload;
    console.log("payload", payload);

    if(!channel || !user || !cycle_time) {
        socket.emit("error", payload);
        console.log("error");
        return;
    }
    console.log("checking channel", channel == _channel);
    if(channel == _channel) {
        // If channel found, store the user and start timer
        console.log("channel matched", _channel);
        gpioInterface.usePin(pins[18], 1);
        state['user'] = user;
        startTimer(cycle_time, user);
    }
});

socket.on('disconnect', function () {
    console.log("disconnected from the server");
});

function reduceOneSecond(timeObj) {
    let { min, sec } = timeObj;
    
    if(sec != 0) {
        sec = sec - 1;
    }
    else if(sec == 0 && min > 0) {
        min = min - 1;
        sec = 59;
    }
    return { min, sec };
}


function startTimer(cycle_time = 90, user) {
    console.log("start timer", cycle_time);
    // Making timeObj
    let timeObj = { min: cycle_time, sec: 0 };
    // Saving time object in the global state
    state['timer'] = timeObj;

    intervalId = setInterval(() => {
        console.log("timeObj", timeObj);
        // Checking if its time to stop machine
        if(timeObj.min == 0 && timeObj.sec == 0) {
            // clearing interval
            clearInterval(intervalId);
            // Stopping machine event
            console.log("stopping machine", timeObj);
            gpioInterface.usePin(pins[18], 0);
            socket.emit("machine_stopped", { _channel });
            // reseting global state
            intervalId = null;
            state['timer'] = null;
            state['user'] = null;
        }
        else {
            // If time has left, reduce one second
            timeObj = reduceOneSecond(timeObj);
            // update the global state
            state['timer'] = timeObj;
            // emit the new timer
            console.log("sending tick");
            socket.emit('tick', { _channel, timeObj });
        }
    }, 1000);
    // emit event that machine has started
    socket.emit("machine_started", { _channel, user, timeObj });
}

function restartTimer(timeObj) {
    intervalId = setInterval(() => {
        // Checking if its time to stop machine
        if(timeObj.min == 0 && timeObj.sec == 0) {
            console.log("stopping machine", timeObj);
            gpioInterface.usePin(pins[18], 0);
            // clearing interval
            clearInterval(intervalId);
            // Stopping machine event
            socket.emit("machine_stopped", { _channel });
            // reseting global state
            intervalId = null;
            state['timer'] = null;
            state['user'] = null;
        }
        else {
            // If time has left, reduce one second
            timeObj = reduceOneSecond(timeObj);
            // update the global state
            state['timer'] = timeObj;
            // emit the new timer
            console.log("sending tick");
            socket.emit('tick', { _channel, timeObj });
        }
    }, 1000);
}

// Reset previouse state
socket.on('reset_previouse_state', payload => {
    const { channel, user, timer } = payload;
    if(channel == _channel) {
        // saving info in global state
        state['timer'] = timer;
        state['user'] = user;
        // starting current 'ON' PIN 18
        gpioInterface.usePin(pins[18], 1);
        restartTimer(timer);
    }
});


socket.on('pin-change', info => {
    console.log("info", info);
    const { pin, value } = info;
    if(pin == 18 && (value == 1 || value == 0)) {
        gpioInterface.usePin(pins[pin], value);
        socket.emit("accessibilty_status", {
            status, _channel, pins
        }); 
    }
});

module.exports = socket;