const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const jwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;
const jwtSecretKey = require("./jwt-key.json");
const e = require("express");
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Object arrays for development before database
let users = [
  {
    id: 1,
    username: "ossi",
    email: "ossi.miilukangas@hotmail.com",
    password: bcrypt.hashSync("ossi123", 6),
  },
];

let stories = [
  {
    id: 1,
    userId: 1,
    username: "ossi",
    title: "Testistoori",
    desc: "testitesti",
    image: {},
    lat: 65.0131155,
    lng: 25.4732011,
  },
];
  
// JWT authentication strategy
let options = {};

options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
options.secretOrKey = jwtSecretKey.secret;

passport.use(
  new jwtStrategy(options, function (jwt_payload, done) {
    // test if the token is expired
    const now = Date.now() / 1000;

    if (jwt_payload.exp > now) {
      done(null, jwt_payload.user);
    } else {
      done(null, false);
    }
  })
);

/*********************************************
 * USER ENDPOINTS
 ********************************************/

app.post("/user/register", (req, res) => {
  // tests that request body has required data
  if ("username" in req.body == false) {
    res.status(400).send("Bad Request: Missing username");
    return;
  }
  if ("password" in req.body == false) {
    res.status(400).send("Bad Request: Missing password");
    return;
  }
  if ("email" in req.body == false) {
    res.status(400).send("Bad Request: Missing email");
    return;
  }

  //Test that username is not taken
  if (users.find((e) => e.username == req.body.username) !== undefined) {
    res.status(400).send("Bad Request: Username already taken");
    return;
  }

  // hash the password
  const hashedPassword = bcrypt.hashSync(req.body.password, 6);

  const newUser = {
    id: users.length + 1,
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  };
  users.push(newUser);

  res.status(201).json({ newUser });
});

app.post("/user/login",
  (req, res) => {
    console.log(req.body);


    const user = users.find((e) => e.username == req.body.username);

    // if user not found
    if (user === undefined) {
      res.status(401).send("Unauthorized: Username not found");
    }

    // compare passwords
    if (bcrypt.compareSync(req.body.password, user.password) == false) {
      res.status(401).send("Unauthorized: Wrong password");
    }

    // construct body and set options
    const body = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const payload = {
      user: body,
    };

    const options = {
      expiresIn: "600s",
    };

    // create and return token
    const token = jwt.sign(payload, jwtSecretKey.secret, options);
    res.status(200).json({ token });
  }
);

// get users for testing
app.get("/user", (req, res) => {
  res.json({ users });
});

/*********************************************
 * STORY ENDPOINTS
 ********************************************/

app.get("/story", (req, res) => {
  res.json({ stories });
});

// Get story by its id
app.get("/story/id/:id", (req, res) => {
  const story = stories.find((e) => e.id == req.params.id);
  if (story !== undefined) {
    res.json({ story });
  } else {
    res.status(404).send("Story Id Not Found");
  }
});

// Get stories by userId
app.get("/story/userid/:userId", (req, res) => {
  const userStories = stories.filter((e) => e.userId == req.params.userId);
  if (userStories.length > 0) {
    res.json({ userStories });
  } else {
    res.status(404).send("Stories with the userId not found");
  }
});

// Get all story locations
app.get("/story/location", (req, res) => {
  let locations = []
  stories.forEach(e => {
    let locObj = {
      id: e.id,
      lat: e.lat,
      lng: e.lng,
    };
    locations.push(locObj);
  });
  res.status(200).send({locations})
})

app.post("/story",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    //TODO: test that request body includes all properties
    if ("title" in req.body == false) {
      res.status(400).send("Bad Request: Missing title");
      return;
    }
    if ("desc" in req.body == false) {
      res.status(400).send("Bad Request: Missing desc");
      return;
    }
    if ("image" in req.body == false) {
      res.status(400).send("Bad Request: Missing image");
      return;
    }
    if ("lat" in req.body == false) {
      res.status(400).send("Bad Request: Missing lat");
      return;
    }
    if ("lng" in req.body == false) {
      res.status(400).send("Bad Request: Missing lng");
      return;
    }

    const newStory = {
      id: stories.length + 1,
      userId: req.user.id,
      username: req.user.username,
      title: req.body.title,
      desc: req.body.desc,
      image: req.body.image,
      lat: req.body.lat,
      lng: req.body.lng,
    };
    stories.push(newStory);

    res.status(201).json(stories[stories.length - 1]);
  }
);

app.delete("/story/id/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // find index of a json object from resources by id
    const result = stories.findIndex((e) => e.id == req.params.id);

    // test that index was found
    if (result === -1) {
      res.status(404).send("Story Id Not Found");
      return;
    }

    // test that the user is authorized to modify the resource
    if (stories[result].userId !== req.user.id) {
      res.status(403).send("Forbidden: User not authorized");
      return;
    }
    stories.splice(result, 1);
    res.status(200).send("Story deleted, Id: " + req.params.id);
  }
);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
