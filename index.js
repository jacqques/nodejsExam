const express = require('express')
const favicon = require('serve-favicon')
const router = require('./routes/routes')
const connection = require('./mysql/create').connection
const session = require('express-session')
const path = require('path')

require('dotenv').config({path:path.join(__dirname, ".env")})

app = express()

//Io setup
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const escapeHTML = require('html-escaper').escape // no XXS plz

// App uses: ------------------------------------------------------------------------------------------
app.use(express.static('public'))
app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(router.router)
app.use(session({
    secret: 'shhItIsASecret',
    resave: false,
    saveUninitialized: true
}))


// Socket/chat ----------------------------------------------------------------------------------------
//query strings, I think it's easier to read this way
const saveChatQuery = 'INSERT INTO chatlogs(chat, username, sendt) VALUES (?, ?, ?);'
const getChatQuery = 'SELECT * FROM chatlogs;'
const deleteChatQuery = 'DELETE FROM chatlogs WHERE sendt IS NOT NULL ORDER BY sendt ASC LIMIT 1;'

const firstnames = ['Morten', 'Thomas', 'Martin', 'Olle']
const lastnames = ['Udyret', 'Monsterman', 'på 500 kg', "om'er"]


io.on('connection', (socket) => {
    socket.username = firstnames[Math.floor(Math.random() * firstnames.length)] + ' ' +
        lastnames[Math.floor(Math.random() * lastnames.length)]
    console.log('new socket with id: ', socket.id)


    connection.query(getChatQuery, (error, result, fields) => {
        if (error) {
            throw new Error(error)
        }
        result.forEach((data) => {
            if (data.chat.slice(0,1) === '!') {
                if (data.chat.slice(1,6) === 'link ') {
                    io.emit(io.emit('new-link', {msg: data.chat, username: data.username}))
                }
            }
            else {
                io.emit('new-msg', {msg: data.chat, username: data.username})
            }
        })
    })

    socket.on('newMsg', (data) => {
        if (data.msg === ''){ // No empty msgs pls
            return
        }

        connection.query(saveChatQuery, [data.msg, socket.username, new Date()], (error) => {
            if (error){
                throw new Error(error)
            }
            // todo udkommenter nedenstående når databasen er tilpas størrelse
            // connection.query(deleteChatQuery) // fjerne ældste sendte besked, så databasen ikke bliver for stor.
        })

        io.emit('new-msg', {msg: escapeHTML(data.msg), username: socket.username})
    })

    socket.on('newLink', (data) => {

        connection.query(saveChatQuery, [data.msg, socket.username, new Date()], (error) => {
            if (error) {
                throw new Error(error)
            }
        })
        io.emit('new-link', {msg: escapeHTML(data.msg), username: socket.username})
    })

    socket.on('newUser', (data) => {
        if (data.user === ''){
            return
        }
        socket.username = data.user
    })


})

// app listen -----------------------------------------------------------------------------------------
PORT = Number(process.env.PORT) || 80

server.listen(PORT, (error) => {

    if (error) {
        throw new Error(error)
    }
    console.log('listening on port: ', PORT)
})