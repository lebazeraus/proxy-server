const path = require('path')
const os = require('os')
const inquirer = require('inquirer')
const ipRegex = require('ip-regex')
// const bcrypt = require('bcryptjs')
const Datastore = require('nedb')
const express = require('express')
const proxy = require('http-proxy-middleware')
//
const tmp = path.join(os.tmpdir(), 'sp-ic')
const db = new Datastore({ filename: tmp })
db.loadDatabase(function (err) {
  if (err) {
    console.log('Iniciando Servidor: Error 001') // BD imposible de cargar
    return false
  }

  db.find({}, function (err, docs) {
    if (err) {
      console.log('Iniciando Servidor: Error 002') // BD imposible de leer
      return false
    }

    if (docs.length) {
      // Run server
      runServer(docs[0].ip)
    } else {
      question()
    }
  })
})

function question() {
  inquirer
  .prompt([ { type: 'input', name: 'IP', message: 'Ingresar IP:' } ])
  .then(({ IP }) => {
    if ( ipRegex({exact: true}).test(IP)) {
      // var hash = bcrypt.hashSync(IP, 10)
      db.insert({ ip: IP }, function (err) {
        if (err) {
          console.log('Iniciando Servidor: Error 003') // BD imposible de leer 
          return false
        }
        runServer(IP)
      });
    } else {
      console.log('IP invalida!')
      question()
    }
  })
}

function runServer(IP) {
  const options = {
    target: 'http://' + IP + ':4688',
    changeOrigin: true,
    logProvider: (provider) => { return provider  }
    // onProxyRes: (proxyRes, req, res) => {
    //   console.log(req.url)
    // }
  }
  const app = express()

  app.use('/', proxy(options))
  console.log('...')
  console.log('v1.0.0')
  console.log('Iniciando Servidor: Ok')
  app.listen(4688)
}
