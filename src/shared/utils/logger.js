import pino from 'pino';
import pinoHttp from 'pino-http';

// const isoTimestamp = () => `"time":"${new Date(Date.now()).toISOString()}"`;

const appLogger = pino({
  base: {},
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: 'pino/file',
    options: {
      destination: './logs/app.log',
    }
  }
});

const accessLogger = pino({
  base: {},
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: 'pino/file',
    options: {
      destination: './logs/access.log',
    }
  }
});

function useHttpLogger(router) {
  router.use(pinoHttp({ logger: accessLogger }));
}

export { accessLogger, appLogger, useHttpLogger };
