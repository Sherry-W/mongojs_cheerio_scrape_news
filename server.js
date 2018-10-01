// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();
app.set('view engine', 'ejs');

// Configure our app for morgan and body parser
app.use(logger("dev"));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Static file support with public folder
app.use(express.static("views"));

// Mongojs configuration
var databaseUrl = "sfgate";
var collections = ["news"];

// Hook our mongojs config to the db var
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Routes
// ======

// Simple index route
app.get("/", function(req, res) {
  db.news.find({}, function(error, data) {
    db.news.find({"fav": true}, function(error, fav) {
      if (error) {
        console.log(error);
      }
      else {
        res.render('pages/index', {
          dat: data,
          fav: fav
        });
      }
    });
  });
});

// ==================

// Route 1
// =======
// This route will retrieve all of the data
// from the scrapedData collection as a json (this will be populated
// by the data you scrape using the next route)
app.get("/all", function(req, res) {
  db.news.find({}, function(error, data) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(data);
    }
  });
});

app.get("/showfav", function(req, res) {
  db.news.find({"fav": true}, function(error, fav) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(fav);
    }
  });
});

// Route 2
// =======
// When you visit this route, the server will
// scrape data from the site of your choice, and save it to
// MongoDB.
// TIP: Think back to how you pushed website data
// into an empty array in the last class. How do you
// push it into a MongoDB collection instead?
app.get("/scrape", function(req, res) {
  // Make a request for the news section of `ycombinator`
  request("https://www.sfgate.com/", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "title" class
    $("h4").each(function(i, element) {
      // Save the text and href of each link enclosed in the current element
      var link = $(element).children('a').attr("href");
      var title = $(element).children('a').text();
      // var list = $(element).parent().siblings('ul').children('li');
      // var para = $(element).parent().siblings('p');

      // If this found element had both a title and a link
      if (link && title && link.indexOf(".com") == -1) {
        // Insert the data in the scrapedData db
        db.news.insert({
          title: title,
          link: "https://www.sfgate.com" + link
        },
        function(err, inserted) {
          if (err) {
            // Log the error if one is encountered during the query
            console.log(err);
          }
          else {
            // Otherwise, log the inserted data
            console.log(inserted);
          }
        });
      }
    });
  });

  // Send a "Scrape Complete" message to the browser
  // res.send("Scrape Complete");
  console.log("Scrape Complete");
});

// ==================

// Mark a book as having been read
app.get("/fav/:id", function(req, res) {
  // Remember: when searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IdYouWantToFind))

  // Update a doc in the books collection with an ObjectId matching
  // the id parameter in the url
  db.news.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      // Set "read" to true for the book we specified
      $set: {
        fav: true
      }
    },
    // When that's done, run this function
    function(error, fav) {
      // show any errors
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the result of our update to the browser
        console.log(fav);
        // res.send(fav);
        // res.render('pages/index', {
        //   fav: fav
        // });
      }
    }
  );
});

// Mark a book as having been not read
app.get("/unfav/:id", function(req, res) {
  // Remember: when searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IdYouWantToFind))

  // Update a doc in the books collection with an ObjectId matching
  // the id parameter in the url
  db.news.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      // Set "read" to false for the book we specified
      $set: {
        fav: false
      }
    },
    // When that's done, run this function
    function(error, fav) {
      // Show any errors
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the result of our update to the browser
        console.log(fav);
        // res.send(fav);
        // res.render('pages/index', {
        //   fav: fav
        // });
      }
    }
  );
});

// Update just one note by an id
app.post("/addnote/:id", function(req, res) {
  // When searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IdYouWantToFind))
    // console.log(req.body.note, req.body);
  // Update the note that matches the object id
  db.news.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      // Set the title, note and modified parameters
      // sent in the req body.
      $set: {
        note: req.body.note,
        modified: Date.now()
      }
    },
    function(error, edited) {
      // Log any errors from mongojs
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(edited);
        // res.send(edited);
      }
    }
  );
});

// Select just one note by an id
app.get("/find/:id", function(req, res) {
  // When searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IdYouWantToFind))

  // Find just one result in the notes collection
  db.news.findOne(
    {
      // Using the id in the url
      _id: mongojs.ObjectId(req.params.id)
    },
    function(error, found) {
      // log any errors
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the note to the browser
        // This will fire off the success function of the ajax request
        // console.log(found);
        res.send(found);
        // res.render('pages/index', {
        //   dat: found,
        // });
      }
    }
  );
});

// Delete One from the DB
app.get("/delete/:id", function(req, res) {
  // Remove a note using the objectID
  db.news.remove(
    {
      _id: mongojs.ObjectID(req.params.id)
    },
    function(error, removed) {
      // Log any errors from mongojs
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(removed);
        // res.send(removed);
      }
    }
  );
});

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
