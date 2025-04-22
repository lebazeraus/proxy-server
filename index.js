import path from 'path';
import os from 'os';
import { program } from 'commander';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import chalk from 'chalk';
import net from 'net';

// Database configuration
const tmp = path.join(os.tmpdir(), 'sp-ic');
const dbFile = tmp; // La base de datos será el archivo 'sp-ic' sin extensión

async function ensureDatabaseExists() {
  try {
    // Intentamos crear el directorio padre si no existe
    await fs.mkdir(path.dirname(dbFile), { recursive: true });
    try {
      await fs.access(dbFile);
    } catch (error) {
      // El archivo no existe, lo creamos con un objeto JSON vacío inicial
      await fs.writeFile(dbFile, '{}', 'utf8');
    }
  } catch (err) {
    console.error(chalk.red('Error ensuring database directory/file:'), err);
    process.exit(1);
  }
}

async function getConfig() {
  try {
    const data = await fs.readFile(dbFile, 'utf8');
    const config = JSON.parse(data);
    return config.proxyConfig;
  } catch (err) {
    console.error(chalk.red('Error reading configuration file:'), err);
    return null;
  }
}

async function saveConfig(protocol, ip, port) {
  try {
    const data = await fs.readFile(dbFile, 'utf8');
    const dbData = JSON.parse(data);
    dbData.proxyConfig = { protocol, ip, port };
    await fs.writeFile(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(chalk.red('Error writing configuration file:'), err);
    return false;
  }
}

// Function to check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false); // Handle other errors if needed
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port);
  });
}

// Language configuration with colors
const languages = {
  es: {
    selectLanguage: '¿Qué idioma deseas usar?',
    languageOptions: ['Español', 'Inglés'],
    configOptions: '¿Qué desea hacer?',
    configChoices: [{ name: 'Cambiar Destino del Proxy' }, { name: 'Salir' }],
    protocolPrompt: 'Protocolo de destino (http o https):',
    ipPrompt: 'IP o Dominio de destino:',
    portPrompt: 'Puerto de destino (opcional, 80 para http, 443 para https por defecto):',
    invalidIp: chalk.red('¡IP o dominio inválido!'),
    invalidProtocol: chalk.red('¡Protocolo inválido! Debe ser http o https.'),
    invalidPort: chalk.red('¡Puerto inválido! Debe ser un número entre 1-65535.'),
    proxyStarted: chalk.green('Proxy iniciado correctamente'),
    serverRunning: (protocol, target, proxyPort) => chalk.cyan(`Servidor ejecutándose en http://localhost:${proxyPort} redirigiendo a ${protocol}://${target}`),
    welcome: chalk.bold.blue('SERVIDOR PROXY BÁSICO'),
    saved: chalk.green('Configuración guardada correctamente'),
    configView: 'Configuración actual:',
    noConfig: chalk.yellow('No se encontró configuración guardada.'),
    goodbye: chalk.yellow('¡Hasta luego!'),
    errors: {
      '001': chalk.red('Error al cargar la base de datos:'),
      '002': chalk.red('Error al consultar la base de datos:'),
      '003': chalk.red('Error al buscar configuración:'),
      '004': chalk.red('Error al actualizar configuración:'),
      '005': chalk.red('Error al insertar configuración:'),
      '006': chalk.red('Error al iniciar el servidor:')
    }
  },
  en: {
    selectLanguage: 'Which language would you like to use?',
    languageOptions: ['Spanish', 'English'],
    configOptions: 'What would you like to do?',
    configChoices: [{ name: 'Change Proxy Destination' }, { name: 'Exit' }],
    protocolPrompt: 'Destination protocol (http or https):',
    ipPrompt: 'Destination IP or Domain:',
    portPrompt: 'Destination port (optional, 80 for http, 443 for https by default):',
    invalidIp: chalk.red('Invalid IP or domain!'),
    invalidProtocol: chalk.red('Invalid protocol! Must be http or https.'),
    invalidPort: chalk.red('Invalid port! Must be a number between 1-65535.'),
    proxyStarted: chalk.green('Proxy started successfully'),
    serverRunning: (protocol, target, proxyPort) => chalk.cyan(`Server running at http://localhost:${proxyPort} redirecting to ${protocol}://${target}`),
    welcome: chalk.bold.blue('BASIC PROXY SERVER'),
    saved: chalk.green('Configuration saved successfully'),
    configView: 'Current configuration:',
    noConfig: chalk.yellow('No saved configuration found.'),
    goodbye: chalk.yellow('Goodbye!'),
    errors: {
      '001': chalk.red('Error loading database:'),
      '002': chalk.red('Error querying database:'),
      '003': chalk.red('Error searching configuration:'),
      '004': chalk.red('Error updating configuration:'),
      '005': chalk.red('Error inserting configuration:'),
      '006': chalk.red('Error al iniciar el servidor:')
    }
  }
};

// Main function
async function main() {
  await ensureDatabaseExists();

  // Configure command-line arguments
  program.option('-c, --config', 'Enter configuration mode');
  program.option('-p, --port <number>', 'Proxy server port (overrides configuration)');
  program.parse(process.argv);

  // Request language
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: chalk.bold('¿Qué idioma deseas usar? / Which language would you like to use?'),
      choices: ['Español', 'English'],
      filter: (val) => val === 'Español' ? 'es' : 'en'
    }
  ]);

  const texts = languages[language];

  // Show welcome banner
  console.clear();
  console.log('\n======================');
  console.log(texts.welcome);
  console.log('======================\n');

  let proxyPort = program.opts().port ? parseInt(program.opts().port) : null;

  // Configuration mode
  if (program.opts().config) {
    try {
      const config = await getConfig();
      if (config) {
        console.log(texts.configView, chalk.yellow(`${config.protocol}://${config.ip}${config.port ? `:${config.port}` : ''}`));
      } else {
        console.log(texts.noConfig);
      }
    } catch (err) {
      console.error(texts.errors['002'], err);
    }

    const { opcion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'opcion',
        message: chalk.bold(texts.configOptions),
        choices: texts.configChoices
      }
    ]);

    if (opcion === texts.configChoices[0].name) { // If option is 'Change Proxy Destination'
      await promptProxyConfig(texts);
    } else {
      console.log(texts.goodbye);
    }
    return;
  }

  // Search for existing configuration
  try {
    const config = await getConfig();

    if (config) {
      await runServer(config.protocol, `${config.ip}${config.port ? `:${config.port}` : ''}`, proxyPort || 3000, texts); // Default proxy port 3000
    } else {
      await promptProxyConfig(texts);
    }
  } catch (err) {
    console.error(texts.errors['002'], err);
    return false;
  }
}

// Function to request proxy configuration (protocol, IP/domain, and optional port)
async function promptProxyConfig(texts) {
  const { protocol } = await inquirer.prompt([
    {
      type: 'list',
      name: 'protocol',
      message: chalk.bold(texts.protocolPrompt),
      choices: ['http', 'https'],
      validate: (input) => ['http', 'https'].includes(input.toLowerCase()) || texts.invalidProtocol
    }
  ]);

  const { IP } = await inquirer.prompt([
    {
      type: 'input',
      name: 'IP',
      message: chalk.bold(texts.ipPrompt),
      validate: (input) => input.trim() !== '' || texts.invalidIp
    }
  ]);

  const { portInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'portInput',
      message: chalk.bold(texts.portPrompt),
      default: protocol === 'https' ? '443' : '80',
      validate: (input) => {
        if (input === '') return true; // Allow empty for default
        const portNumber = parseInt(input);
        return (!isNaN(portNumber) && portNumber >= 1 && portNumber <= 65535) || texts.invalidPort;
      }
    }
  ]);

  const port = portInput === '' ? null : parseInt(portInput);

  try {
    await saveConfig(protocol, IP, port);
    console.log(texts.saved);
    await runServer(protocol, `${IP}${port ? `:${port}` : ''}`, 3000, texts); // Default proxy port 3000
  } catch (err) {
    console.error(texts.errors['003'], err);
    return false;
  }
}

// Function to start the proxy server
async function runServer(protocol, target, proxyPort, texts) {
  const options = {
    target: `${protocol}://${target}`,
    changeOrigin: true,
    logProvider: (provider) => provider,
    secure: protocol === 'https' // Enable SSL verification for HTTPS targets
  };

  const app = express();
  app.use('/', createProxyMiddleware(options));

  try {
    const isUsed = await isPortInUse(proxyPort);
    if (isUsed) {
      console.error(texts.errors['006'], chalk.red(`El puerto ${proxyPort} ya está en uso.`));
      return false;
    }

    await new Promise((resolve, reject) => {
      const server = app.listen(proxyPort, () => {
        console.log(texts.proxyStarted);
        console.log(texts.serverRunning(protocol, target, proxyPort));
        resolve();
      });
      server.on('error', (err) => {
        reject(err);
      });
    });
    return true;
  } catch (err) {
    console.error(texts.errors['006'], err);
    return false;
  }
}

// Start the application
main().catch(err => console.error(chalk.red('Error inesperado:'), err));