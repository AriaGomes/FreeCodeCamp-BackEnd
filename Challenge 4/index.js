const express = require('express')
const app = express()
const cors = require('cors')
let bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.use((req, res, next) => {
  console.log("method: " + req.method + "  |  path: " + req.path + "  |  IP - " + req.ip);
  next();
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//DB Connect
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.MONGO_DB,
  useNewUrlParser: true,
}).then(() => {
  console.log("Connected to " + process.env.MONGO_DB)
}).catch((err) => console.log(err.message))

// 2) Create a 'User' Model
var userSchema = new mongoose.Schema({
  username: String,
});

// 3) Create and Save a User
var User = mongoose.model('user', userSchema);


// 2) Create a 'Exercise' Model
var excerciseSchema = new mongoose.Schema({
   username: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

// 3) Create and Save a Exercise
var Exercise = mongoose.model('exercise', excerciseSchema);




//Create user
//Get all users
app.route('/api/users').get((req, res) => {
  User.find({}, (error, data) => {
    //console.log(data);
    res.json(data);
  });
  //Specified user to be added
}).post((req, res) => {
  let username = req.body.username
  console.log(username)

//Look if username is already taken
User.find({ username: username }, function(err, userFound) {
    if (err) return console.log(err);

    
  // If user does not exists, create one
    if (userFound.length == 0) {
var newUser = new User({ username: username});

newUser.save((error, data) => {
        if (error) return console.log(error);
        const reducedData = {
          "username": data.username, 
          "_id": data._id
        };
        console.log(reducedData)
        res.json(reducedData);
      });
    }
    else res.send("Username " + username + " already exists")
  });
});
//END create user



//Start add exercise
app.post('/api/users/:_id/exercises',(req, res) => {

  let id = req.body[":_id"] || req.params._id;
  let desc = req.body.description
  let dur = req.body.duration
  let date = req.body.date
  
  User.findOne({_id: id}, function(err, data) {
    if (err) res.json("Invalid ID")
    if (!data) res.json("Invalid ID")
    
    console.log(data)
    const username = data.username;
    id = data._id
    
    // console.log(username)
  if(!date)
  {
    date = new Date().now
  }
    else{
      date = new Date(date)
    }

  if(!desc)
  {
    res.send("Description is required")
  }

  if(!dur)
  {
    res.send("Duration is required")
  }


    
    var newExercise = new Exercise({
    username: username,
    id: id,
    description: desc,
    duration: dur,
    date: date
  })
  
  newExercise.save((err,data) => {
    if (err) return console.log(err)
    
    const reduced = {
      "_id": id,
      "username": data.username,
      "date": data.date.toDateString(),
      "duration": data.duration,
      "description": data.description,
    }
    res.json(reduced);
    console.log(reduced)
  })
    
    
  });  
  //Debug
  console.log(id, desc, dur, date);

  
});
//End add exercise


// PATH /api/users/:_id/logs?[from][&to][&limit]
app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.body["_id"] || req.params._id;
  var fromDate = req.query.from;
  var toDate = req.query.to;
  var limit = req.query.limit;

  console.log(id, fromDate, toDate, limit);

  // Validate the query parameters
  if (fromDate) {
    fromDate = new Date(fromDate);
    if (fromDate == "Invalid Date") {
      res.json("Invalid Date Entered");
      return;
    }
  }

  if (toDate) {
    toDate = new Date(toDate);
    if (toDate == "Invalid Date") {
      res.json("Invalid Date Entered");
      return;
    }
  }

  if (limit) {
    limit = new Number(limit);
    if (isNaN(limit)) {
      res.json("Invalid Limit Entered");
      return;
    }
  }

  // Get the user's information
  User.findOne({ "_id" : id }, (error, data) => {
    if (error) {
      res.json("Invalid UserID");
      return console.log(error);
    }
    if (!data) {
      res.json("Invalid UserID");
    } else {

      // Initialize the object to be returned
      const usernameFound = data.username;
      var objToReturn = { "_id" : id, "username" : usernameFound };

      // Initialize filters for the count() and find() methods
      var findFilter = { "username" : usernameFound };
      var dateFilter = {};

      // Add to and from keys to the object if available
      // Add date limits to the date filter to be used in the find() method on the Exercise model
      if (fromDate) {
        objToReturn["from"] = fromDate.toDateString();
        dateFilter["$gte"] = fromDate;
        if (toDate) {
          objToReturn["to"] = toDate.toDateString();
          dateFilter["$lt"] = toDate;
        } else {
          dateFilter["$lt"] = Date.now();
        }
      }

      if (toDate) {
        objToReturn["to"] = toDate.toDateString();
        dateFilter["$lt"] = toDate;
        dateFilter["$gte"] = new Date("1960-01-01");
      }

      // Add dateFilter to findFilter if either date is provided
      if (toDate || fromDate) {
        findFilter.date = dateFilter;
      }

      console.log(findFilter);
      console.log(dateFilter);

      // Add the count entered or find the count between dates
      Exercise.count(findFilter, (error, data) => {
        if (error) {
          res.json("Invalid Date Entered");
          return console.log(error);
        }
        // Add the count key 
        var count = data;
        if (limit && limit < count) {
          count = limit;
        }
        objToReturn["count"] = count;


        // Find the exercises and add a log key linked to an array of exercises
        Exercise.find(findFilter, (error, data) => {
          if (error) return console.log(error);

          // console.log(data);

          var logArray = [];
          var objectSubset = {};
          var count = 0;

          // Iterate through data array for description, duration, and date keys
          data.forEach(function(val) {
            count += 1;
            if (!limit || count <= limit) {
              objectSubset = {};
              objectSubset.description = val.description;
              objectSubset.duration = val.duration;
              objectSubset.date = val.date.toDateString();
              console.log(objectSubset);
              logArray.push(objectSubset);
            }
          });

          // Add the log array of objects to the object to return
          objToReturn["log"] = logArray;

          // Return the completed JSON object
          res.json(objToReturn);
        });

      });

    }
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
