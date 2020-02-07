const express = require('express')
const proxy = require('http-proxy-middleware')
 
const app = express()
 
app.use('/', proxy({ target: 'http://26.92.178.124', changeOrigin: true }))

app.listen(3088)
