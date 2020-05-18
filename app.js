const jayson = require('jayson');
const bodyParser = require('body-parser');
const connect = require('connect');
const { Cluster } = require('puppeteer-cluster');
const settings = require('./config/settings');
const extractRequestURI = require('./methods/extractRequestURI');

(async () => {
  const logger = settings.logger;
  const puppeteer = await Cluster.launch(settings.cluster);
  const server = jayson.Server({
    extractRequestURI: new jayson.Method({
      handler: extractRequestURI,
      params: { puppeteer: puppeteer },
    }),
  });
  const app = connect();

  app.use(bodyParser.json());
  app.use(server.middleware());
  app.listen(settings.server.port, function () {
    logger.info('Server listening on port %d', settings.server.port);
  });
})();
