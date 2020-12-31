const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');

const connectDB = require('./config/db');

//Load config
dotenv.config({ path: './config/config.env' });

//Initialize app
const app = express();

//Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Method Override
app.use(
  methodOverride((req, res) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }),
);

//Passport config
require('./config/passport')(passport);

//Connect DB
connectDB();

//Morgan logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Handlebars helpers
const { formatDate, truncate, editIcon, select } = require('./helpers/hbs');

//Handlebars
app.engine(
  '.hbs',
  exphbs({
    helpers: { formatDate, truncate, editIcon, select },
    defaultLayout: 'main',
    extname: '.hbs',
  }),
);
app.set('view engine', '.hbs');

//Static folder
app.use(express.static('./public'));

//Sessions
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  }),
);

//Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

//Global var
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

//Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/stories', require('./routes/stories'));

const PORT = process.env.PORT;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`),
);
