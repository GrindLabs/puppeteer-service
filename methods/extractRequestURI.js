const { logger, cluster } = require('../config/settings');

module.exports = async (args, callback) => {
  const extractRequestURI = async ({ page, data }) => {
    let requestURI = null;
    const url = data.url;
    const regex = data.regex;

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      const pattern = new RegExp(regex, 'i');
      const found = request.url().match(pattern);

      logger.debug('Request intercepted to %s', request.url());

      if (found && !requestURI) {
        logger.debug('Match regex "%s" found: %O', regex, found);
        requestURI = found[0];
        request.abort();
      } else {
        request.continue();
      }
    });

    logger.info('Searching for pattern "%s" in URL %s', regex, url);
    await page.setUserAgent(cluster.puppeteerOptions.userAgent);
    await page.goto(url, { waitUntil: 'networkidle0' });
    return requestURI;
  };

  try {
    logger.info('Enqueuing URL: %s', args.url);
    const requestURI = await args.puppeteer.execute(args, extractRequestURI);
    logger.info(
      'Pattern "%s" %s in %s',
      args.regex,
      requestURI ? `found the URI ${requestURI}` : 'not found',
      args.url
    );
    callback(null, requestURI);
  } catch (err) {
    logger.error(err);
    callback(null, null);
  }
};
