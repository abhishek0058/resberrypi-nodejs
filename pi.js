const pi = require('express')();
require('./sockets');

pi.get('/', (req, res) => {
    res.send("PI");
})

pi.listen(3001,() => console.log("PI is running on 3001"));


/*
 if(R[0]=='on'):
            print("ON");
            GPIO.output(18,True)
            time.sleep(2)
            pubnub.publish().channel(channel).message('TURNEDON#'+R[1]).pn_async(show)
        elif(R[0]=='off'):
            print("OFF");
            GPIO.output(18,False)
            time.sleep(2)
            pubnub.publish().channel(channel).message('TURNEDOFF#'+R[1]).pn_async(show)
        elif(R[0]=='check'):
            print(R)
            pubnub.publish().channel(channel).message('TRUE').pn_async(show)

        elif(R[0]=='ms'):
            if(GPIO.input(17)==1):
              pubnub.publish().channel(channel).message('MON#'+R[1]).pn_async(show)
            else:
              pubnub.publish().channel(channel).message('MOFF#'+R[1]).pn_async(show)

	elif(R[0]=='start_relay'):
	    GPIO.output(18,True)

*/