const path = require('path')
const os = require('os')
const inquirer = require('inquirer')
const ipRegex = require('ip-regex')
const Datastore = require('nedb')
const express = require('express')
const proxy = require('http-proxy-middleware')
const program = require('commander')
const tmp = path.join(os.tmpdir(), 'sp-ic')
const db = new Datastore({ filename: tmp })

program.option('-c, --config')
program.parse(process.argv)

db.loadDatabase(function (err) {
  if (err) {
    console.log('Iniciando Servidor: Error 001') // BD imposible de cargar
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
      db.find({}, function (err, docs) {
        if (err) {
          console.log('Iniciando Servidor: Error 003') // BD imposible de leer 
          return false
        }
        if (docs.length) {
          db.update({ ip: docs[0].ip }, { ip: IP }, {}, function (err) {
            if (err) {
              console.log('Iniciando Servidor: Error 004') // BD imposible de leer 
              return false
            }
            runServer(IP)
          })
        } else {
          db.insert({ ip: IP }, function (err) {
            if (err) {
              console.log('Iniciando Servidor: Error 005') // BD imposible de leer 
              return false
            }
            runServer(IP)
          })
        }
      })
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
  }
  const app = express()

  app.use('/', proxy(options))
  console.log('...')
  console.log('v1.1.0')
  console.log('Iniciando Servidor: Ok')
  app.listen(4688)
}
