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

// Index route
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

// All
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

// Show only Fav
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

// Scrapr News
app.get("/scrape", function(req, res) {
  request("https://www.sfgate.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    $("h4").each(function(i, element) {
      var link = $(element).children('a').attr("href");
      var title = $(element).children('a').text();

      if (link && title && link.indexOf(".com") == -1) {
        
        db.news.insert({
          title: title,
          link: "https://www.sfgate.com" + link
        },
        function(err, inserted) {
          if (err) {
            console.log(err);
          }
          else {
            console.log(inserted);
          }
        });
      }
    });
  });

  // res.send("Scrape Complete");
  console.log("Scrape Complete");
});

// Set Fav
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
      $set: {
        fav: true
      }
    },

    function(error, fav) {
      
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

// Remove Fav
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
      $set: {
        fav: false
      }
    },

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

// Add note
app.post("/addnote/:id", function(req, res) {

  db.news.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      $set: {
        note: req.body.note,
        modified: Date.now()
      }
    },
    function(error, edited) {
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

// Find ID
app.get("/find/:id", function(req, res) {

  db.news.findOne(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    function(error, found) {

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


// Delete note
app.get("/delete/:id", function(req, res) {
  db.news.remove(
    {
      _id: mongojs.ObjectID(req.params.id)
    },
    function(error, removed) {
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
