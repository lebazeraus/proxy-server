# Proxy Server

Servidor proxy básico como herramienta CLI para conexiones a maquinas virtuales

## Pre requisitos
Necesitará [Node.js](https://nodejs.org/en/) y [Git SCM](https://git-scm.com) instalado previamente en su equipo.

## Instalación
```bash
$ git clone https://github.com/lebazeraus/proxy-server.git
```

## Uso en desarrollo
```bash
$ npm run dev
> IP: 127.0.0.1
> Puerto: 3000
> Proxy iniciado
```
La IP y el puerto quedan guardadas en los temporales del sistema, para cambiar estas opciones use en desarrollo:
```bash
$ npm run dev -c
```
Desde el binario:
```bash
# En Windows
$ ps-win-x64.exe -c
```



## Compilar
Instale `npm i -g pkg` y use de la siguiente forma:
```bash
$ pkg index.js --out-path bin
```

Para Windows x64
```bash
$ npm run build
```
