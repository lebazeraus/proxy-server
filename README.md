# Proxy Server

Servidor proxy básico como herramienta CLI para conexiones a maquinas virtuales

## Pre requisitos
Necesitará [Node.js](https://nodejs.org/en/) y [Git SCM](https://git-scm.com) instalado previamente en su equipo.

## Instalación
```bash
$ git clone https://github.com/lebazeraus/proxy-server.git
```

## Uso
```bash
$ node index.js
> IP: 127.0.0.1
> Puerto: 3000
> Proxy iniciado
```

## Compilar
Instale `npm i pkg -g` y use de la siguiente forma:
```bash
$ pkg index.js --out-path bin
```
