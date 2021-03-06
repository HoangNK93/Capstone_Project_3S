var bodyParser     = require('body-parser');
var morgan         = require('morgan');
var methodOverride = require('method-override');
var path           = require('path');
var express        = require('express');
var logger         = require('./util/logger');
var config         = require('./config/config');
var models         = require('./entities');
var cors           = require('cors'); // Allow Cross-Origin Resource Sharing (to call API)

var app = express();
var server = require('http').createServer(app);



// setup middleware
app.set('models', models);

// For HOME PAGE
app.use(express.static(path.resolve('views/frontEnd')));
app.get('/', function(req, res, next) {
    // console.log('you request homepage', req.url);    
    res.status(200).sendFile(path.join(__dirname + '/views/frontEnd/home.html'));
});

app.use('/app', express.static(path.resolve('views')));
app.use('/assets', express.static(path.resolve('views/assets')));
app.use('/components', express.static(path.resolve('views/components')));
app.use('/libs', express.static(path.resolve('node_modules')));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());

var socket = require('./socket')(server,app);
app.set('io', {
    socket: socket.io
});
// setup routes
require('./routes')(app);
//
var schedule       = require('./util/ledgerSchedule')( app);
schedule.autoPayment(0, 23, 59);


// setup global error handler
app.use(function (err, req, res, next) {
    console.log(err.name);
    if (err.name === 'UnauthorizedError') {
        logger.error('UnauthorizedError');
        res.status(401).send('Invalid token');
        return;
    }
    logger.error(err.stack);
    res.status(500).send('Oops');
});

// setup database, start server after syncing database
app.get('models').sequelize.sync().then(function () {
    server.listen(config.port, function () {
        logger.log('Listening on http://localhost:' + config.port);
    });
});

// setup for unit test
exports.app = app;
