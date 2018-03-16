const express = require('express');
const request = require('superagent');
// Create express app
const app = express();

// Set the view engine to use EJS as well as set the default views directory
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views/');

// Tell express out of which directory to serve static assets like CSS and images
app.use(express.static(__dirname + '/public'));

const NON_INTERACTIVE_CLIENT_ID = 'm0h2eoj4LYAsAcZtEvviaZTJafMcUXw8';
const NON_INTERACTIVE_CLIENT_SECRET = 'gbee-JDoe6Iv5l7aqvUj4I58qvi11tymnhOCZ9WejoPetcKxDZ8YJnCBASkIiF-U';

// Define object used to exchange credentials
const authData = {
    "client_id": NON_INTERACTIVE_CLIENT_ID,
    "client_secret": NON_INTERACTIVE_CLIENT_SECRET,
    "grant_type": 'client_credentials',
    "audience": 'movieapp'
};

function getAccessToken(req, res, next){
    request
        .post('https://stefanik.auth0.com/oauth/token')
        .send(authData)
        .end(function(err, res){
            if(res.body.access_token){
                req.access_token = res.body.access_token;
                next();
            } else {
                res.send(401, `Unauthorized`);
            }
        });
};

// Homepage route
app.get('/', function(req, res){
    res.render('index');
});

/* For the movies route, we’ll call the getAccessToken middleware to ensure we have an access token. 
If we do have a valid access_token, we’ll make a request with the superagent library and 
we’ll be sure to add our access_token in an Authorization header before making the request to our API.

Once the request is sent out, our API will validate that the access_token has the right scope 
to request the /movies resource and if it does, will return the movie data. 
We’ll take this movie data, and pass it alongside our movies.ejs template for rendering */
app.get('/movies', getAccessToken, function(req, res){
    request
        .get('http://localhost:8080/movies')
        .set('Authorization', 'Bearer', + req.access_token)
        .end(function(err, data){
            if(data.status == 403){
                res.send(403, '403 Forbidden');
            } else {
                let movies = data.body;
                res.render('movies', { movies: movies });
            }
        }
    );
});

/*The process will be the same for the remaining routes. We’ll make sure to get the 
acess_token first and then make the request to our API to get the data.
The key difference on the authors route, is that for our client, 
we’re naming the route /authors, but our API endpoint is /reviewers. 
Our route on the client does not have to match the API endpoint route.*/

app.get('/authors', getAccessToken, function(req, res){
    request
        .get('http://localhost:8080/authors')
        .set('Authorization', 'Bearer ' + req.access_token)
        .end(function(err, data) {
            if(data.status == 403){
                res.send(403, '403 Forbidden');
            } else {
                var authors = data.body;
                res.render('authors', { authors : authors });
            }
        }
    );
});


app.get('/publications', getAccessToken, function(req, res){
    request
        .get('http://localhost:8080/publications')
        .set('Authorization', 'Bearer ' + req.access_token)
        .end(function(err, data) {
            if(data.status == 403){
                res.send(403, '403 Forbidden');
            } else {
                var publications = data.body;
                res.render('publications', { publications : publications });
            }
        }
    );  
});

/* We’ve added the pending route, but calling this route from the 
MovieAnalyst Website will always result in a 403 Forbidden error 
as this client does not have the admin scope required to get the data.*/

app.get('/pending', getAccessToken, function(req, res){
    request
      .get('http://localhost:8080/pending')
      .set('Authorization', 'Bearer ' + req.access_token)
      .end(function(err, data) {
        if(data.status == 403){
          res.status(403).send('403 Forbidden');
        }
      }
    );
});

app.listen(3000);

