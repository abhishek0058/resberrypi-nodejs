const pi = require('express')();
require('./sockets');

pi.get('/', (req, res) => {
    res.send("PI");
})

pi.listen(3001,() => console.log("PI is running on 3001"));