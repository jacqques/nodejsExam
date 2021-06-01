// planned on using mongodb, but due to time constraints, I went with what I know.
// Couldn't find an easy way to do, well, anything. MySQL seems simpler to use... Maybe I am an idiot...
const mysql = require('mysql')
const path = require('path')
require('dotenv').config({path: path.join(__dirname, '../.env')})

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE

})

console.log(process.env.DB_DATABASE)
connection.connect()

module.exports = {
    connection
}

