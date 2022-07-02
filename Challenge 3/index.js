require('dotenv').config();
const express = require('express');
const cors = require('cors');
let bodyParser = require('body-parser');
const app = express();

const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
let shortUrlIndex = 0;
let arr = []

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req,res) {
  let url = req.body.url
  if(url.match(urlRegex))
  {
    arr.push(url);
    console.log(arr)
    res.json({original_url: url, short_url: shortUrlIndex++});
  }
  else
  {
    res.json({ error: 'invalid url' });
  }
  
  
});


app.get("/api/shorturl/:url?", function(req, res) {
  let url = req.params.url
  console.log(url)
  res.redirect(arr[url])
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
