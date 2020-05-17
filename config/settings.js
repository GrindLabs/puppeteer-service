const dotenv = require('dotenv');
const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const { Cluster } = require('puppeteer-cluster');

// Load ENV VARS
dotenv.config();

// Environment settings
const isDebug = parseInt(process.env.DEBUG) === 1;

// Logger settings
const logger = winston.createLogger({
  exitOnError: false,
  level: isDebug ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.label({ label: isDebug ? 'development' : 'production' }),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      level: 'info',
      filename: `${path.resolve(
        path.dirname('')
      )}/logs/puppeteer-service-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '5d',
    }),
  ],
});

// Server settings
const server = {
  port: process.env.SERVER_PORT,
};

// Cluster settings
const cluster = {
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: parseInt(process.env.CLUSTER_CONCURRENCY),
  puppeteerOptions: {
    headless: true,
    executablePath: process.env.PUPPETEER_BROWSER_PATH,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ['--no-sandbox'],
    timeout: 60000,
    userAgent: process.env.PUPPETEER_USER_AGENT,
  },
  retryDelay: 5,
  timeout: 60000,
  workerCreationDelay: 500,
};

// Export settings
module.exports = { isDebug, logger, server, cluster };
