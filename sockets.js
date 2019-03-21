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
const state = { user: null, timer: null };

socket.on('connect', function () {
    // registering machine as active
    socket.emit("registerMachine", { _channel });
    console.log("emitting accessibility status");
});

// Listening for machine start event from server
socket.on('turn_machine_on', (payload) => {
    const { channel, user, cycle_time } = payload;
    if(!channel || !user || !cycle_time) {
        socket.emit("error", payload);
        return;
    }
    if(channel == state._channel) {
        // If channel found, store the user and start timer
        this.state['user'] = user;
        startTimer(cycle_time);
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


function startTimer(cycle_time = 90) {
    // Making timeObj
    let timeObj = { min: cycle_time, sec: 0 };
    // Saving time object in the global state
    this.state['timer'] = timeObj;

    intervalId = setInterval(() => {
        // Checking if its time to stop machine
        if(timeObj.min == 0 && timeObj.sec == 0) {
            // clearing interval
            clearInterval(intervalId);
            // Stopping machine event
            socket.emit("machine_stopped", { channel, user });
            // reseting global state
            intervalId = null;
            this.state = { timer: null, user: null };
        }
        else {
            // If time has left, reduce one second
            timeObj = reduceOneSecond(timeObj);
            // update the global state
            this.state['timer'] = timeObj;
            // emit the new timer
            socket.emit('tick', { channel, timer });
        }
    }, 1000);
    // emit event that machine has started
    socket.emit("machine_started", { channel, user, timeObj });
}

function restartTimer(timeObj) {
    intervalId = setInterval(() => {
        // Checking if its time to stop machine
        if(timeObj.min == 0 && timeObj.sec == 0) {
            // clearing interval
            clearInterval(intervalId);
            // Stopping machine event
            socket.emit("machine_stopped", { channel, user });
            // reseting global state
            intervalId = null;
            this.state = { timer: null, user: null };
        }
        else {
            // If time has left, reduce one second
            timeObj = reduceOneSecond(timeObj);
            // update the global state
            this.state['timer'] = timeObj;
            // emit the new timer
            socket.emit('tick', { channel, timer });
        }
    }, 1000);
}

// Reset previouse state
socket.on('reset_previouse_state', payload => {
    const { channel, user, timer } = payload;
    if(channel == _channel) {
        // saving info in global state
        this.state = { user, timer };
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