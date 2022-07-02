// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/:date?", function(req, res) {
  if(req.params.date)
  {
    let date = req.params.date;

    

    
      if(Number.isInteger(Number(date)))
      {
        req.unix = Number(date);
        req.utc = new Date(Number(date)).toUTCString()
        console.log(req.utc);
      }
    else
    {
      if(new Date(date) == "Invalid Date")
    {
      console.log(Date(date));
      res.json({error: "Invalid Date"})
      return -1;
    }
      
     req.utc = new Date(date).toUTCString()
     req.unix = new Date(date).getTime()
    }
  }
  else
  {
    req.utc = new Date().toUTCString();
    req.unix = new Date().getTime();
  }

  res.json({unix: req.unix, utc: req.utc})
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});