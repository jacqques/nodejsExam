const express = require('express')
const fs = require('fs')
const path = require('path')
const nodeFetch = require('node-fetch')
const session = require('express-session')
const connection = require('../mysql/create').connection
const bcrypt = require('bcrypt')
const saltrounds = 12

const cheerio = require('cheerio')

const router = express.Router()

router.use(express.json())
router.use(session({
    secret: 'shhItIsASecret',
    resave: false,
    saveUninitialized: true
}))

// Server side rendering! Yay -------------------------------------------------------------------------
const header = fs.readFileSync(path.join(__dirname, '../public/html/defaults/header.html'))
const footer = fs.readFileSync(path.join(__dirname, '../public/html/defaults/footer.html'))

const index = fs.readFileSync(path.join(__dirname, '../public/html/index.html'))
const chatPage = fs.readFileSync(path.join(__dirname, '../public/html/chat.html'))
const proxyPage = fs.readFileSync(path.join(__dirname, '../public/html/proxyjobs.html'))
const makelogin = fs.readFileSync(path.join(__dirname, '../public/html/makelogin.html'))

// Get requests ---------------------------------------------------------------------------------------
router.get('/chat', (req, res) => {

    res.send(header + chatPage + footer)
})

// Jobindex webscraber, cuz why not? ------------------------------------------------------------------
async function scrapey(pages=1, keyword='nodejs') { //kæmpe bloated function... :(
    let url = `https://www.jobindex.dk/jobsoegning/storkoebenhavn?page=${pages}&q=${keyword}`
    let finalString = ''
    finalString = nodeFetch(url)
        .then(resolve => resolve.text())
        .then(body => {
            const $ = cheerio.load(body)
            let bigString = ""
            let listen = []
            // finder nice opslag
            $('.PaidJob').each((i, title) => {
                const titleNode = $(title)
                const somelist = []
                titleNode.find('a').each((index, element) => {
                    somelist.push($(element).attr('href'))
                })
                const titleText = (titleNode.find('p').text())
                listen.push([titleText, somelist[somelist.length - 1]])
            })

            listen.map(string => { //den her del kunne laves til anden function, bliver brugt 2 gange.
                bigString += '</br>'
                bigString += `<p>${string[0]}</p>`
                bigString += '</br>'
                bigString += `<a href="${string[1]}" target="_blank">Afsted til ansøgningen!</a>`
                bigString += '</br>'
            })
            // finder jobindex robot opslag
            listen = []

            $('.jix_robotjob-inner').each((index, element) => {
                const elementNode = $(element)
                let link = elementNode.find('a').attr('href')
                let text = elementNode.text().split(`\n`)
                let pushText = ''
                pushText += text[2] + `\n`
                pushText += text[5]
                pushText += text[7] + `\n`
                pushText += text[9]
                listen.push([pushText, link])
            })
            listen.map(string => {
                bigString += '</br>'
                bigString += `<p>${string[0]}</p>`
                bigString += '</br>'
                bigString += `<a href="${string[1]}" target="_blank">Afsted til ansøgningen!</a>`
                bigString += '</br>'
            })

            return bigString
        })
        .catch(error => console.log(error))
    return finalString
}

let defaultProx // load for all users once, instead on every visit. Means server has to restart
//sometimes, or data gets outdated.
async function setProx(){
    defaultProx = await scrapey()
}
setProx() // right on startup defaultProx is undefined, but by the time anyone does something, it's fine.

router.get('/proxytube', async (req, res) => {

    res.send(header + proxyPage + '<p>Searched for word: nodejs</p>' + '<p>Searched on page: 1</p>' + defaultProx + footer)
})

router.post('/proxytube', async (req, res) => {
    let result = await scrapey(req.body.pages, req.body.search)
    console.log(req.body)

    res.send(result)
})


// login but it doesn't do anything --------------------------------------------------------------------
let tryLogin = 'select * from login where username=?'
let createLogin = 'insert into login (username, password) values (?, ?)'

router.get('/', (req, res) => {
    res.send(header + index + footer)
})

router.post('/login', (req, res) => {
    connection.query(tryLogin, [req.body.username] ,(error, result, fields) => {
        if (result.length === 0) { // no match for username
            res.send(false)
            return
        }
        bcrypt.compare(req.body.password, result[0].password, (error, hashResult) => {
            //If log in goes futher, this should be done here
            res.send(hashResult)
        })
    })
})

router.get('/makelogin', ((req, res) => {

    res.send(header + makelogin + footer)
}))

router.post('/makelogin', (req, res) => {
    bcrypt.hash(req.body.password, saltrounds, (error, hash) => {
        connection.query(createLogin, [req.body.username, hash], (error, result, fields) => {
            res.send('success')
        })
    })
})

// get error pages ------------------------------------------------------------------------------------
router.get('/*', (req, res) => {
    res.status(404)
    res.send(header + '<h1>ERROR 404, page not found!</h1>' + footer)
})

module.exports = {
    router
}