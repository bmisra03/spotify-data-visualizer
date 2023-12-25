require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser());

app.use('/auth', authRoutes);

app.get('/', (req, res)=>{
    res.json({mssg: 'Hello, world'});
});

app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
});