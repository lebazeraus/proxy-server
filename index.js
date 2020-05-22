const path = require('path')
const os = require('os')
const program = require('commander')
const express = require('express')
const proxy = require('http-proxy-middleware')
const inquirer = require('inquirer')
const ipRegex = require('ip-regex')
const Datastore = require('nedb')
const tmp = path.join(os.tmpdir(), 'sp-ic')
const db = new Datastore({ filename: tmp })

program.option('-c, --config')
program.parse(process.argv)

db.loadDatabase(function (err) {
  if (err) {
    console.log('Error 001')
    return false
  }
  // CMD
  if (program.config) {
    inquirer
    .prompt([ { type: 'list', name: 'opcion', message: '¿Qué desea hacer?', choices: [{ name: 'Cambiar IP' }, { name: 'Salir' }] } ])
    .then(({ opcion }) => {
      if (opcion === 'Cambiar IP') {
        question()
      }
    })
  
    return false
  }

  db.find({}, function (err, docs) {
    if (err) {
      console.log('Error 002')
      return false
    }

    if (docs.length) {
      // Run server
      runServer(docs[0].ip, docs[0].port)
    } else {
      question()
    }
  })
})

function question() {
  inquirer
  .prompt([ { type: 'input', name: 'IP', message: 'IP (Sin el puerto):' }, { type: 'input', name: 'port', message: 'Puerto:' } ])
  .then(({ IP, port }) => {
    if ( ipRegex({exact: true}).test(IP)) {
      db.find({}, function (err, docs) {
        if (err) {
          console.log('Error 003')
          return false
        }
        if (docs.length) {
          db.update({ ip: docs[0].ip, port: docs[0].port }, { ip: IP, port }, {}, function (err) {
            if (err) {
              console.log('Error 004')
              return false
            }
            runServer(IP, port)
          })
        } else {
          db.insert({ ip: IP, port }, function (err) {
            if (err) {
              console.log('Error 005')
              return false
            }
            runServer(IP, port)
          })
        }
      })
    } else {
      console.log('IP invalida!')
      question()
    }
  })
}

function runServer(IP, port) {
  const options = {
    target: 'http://' + IP + ':' + port,
    changeOrigin: true,
    logProvider: (provider) => { return provider  }
  }
  const app = express()

  app.use('/', proxy(options))
  app.listen(port)
  console.log('...')
  console.log('v1.2.0')
  console.log('Proxy iniciado')
}
