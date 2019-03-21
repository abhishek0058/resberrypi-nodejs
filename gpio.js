const Gpio = require('onoff').Gpio;
// make an variable which we will export
let interface = null;

// check if we can access the GPIO in the system
if(Gpio.accessible) {
    // this will the interface that will be used by the sockets 
    interface = {
        // function to use pin
        // @params 
        // PIN => Gpio object
        // value => [1, 0]
        usePin: (PIN, value) => {
            PIN.writeSync(value);
        },
        // function to create a Gpio object
        // @params
        // pinNo => [17, 18]
        // direction => ['in','out']
        getPIN: (pinNo, direction) => {
            return new Gpio(pinNo, direction);
        },
        checkAccessibility: () => {
            return Gpio.accessible;
        }
    }
}
else {
    // if not accessible, just log these values
    interface = {
        usePin: (PIN, value) => {
            console.log("virtual pin", PIN, "value", value);
        },
        getPIN: (pinNo, direction) => {
            console.log("virtual pin with pinNO", pinNo, "direction", direction);
        }
    }
}

interface.checkAccessibility = () =>  Gpio.accessible

module.exports = interface;