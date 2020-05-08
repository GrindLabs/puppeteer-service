const { logger, cluster } = require('../config/settings');

module.exports = async (args, callback) => {
  let extractStream = async ({ page, data }) => {
    let streamURL = null;
    let url = data.url;
    let ext = data.ext;

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      let regex = new RegExp(`.*\.${ext}.*`, 'i');
      let found = request.url().match(regex);

      logger.debug('Request intercepted to %s', request.url());

      if (found && !streamURL) {
        logger.debug('Match regex "%s" found: %O', regex, found);
        streamURL = found[0];
        request.abort();
      } else {
        request.continue();
      }
    });

    logger.info('Searching for %s stream in URL %s', ext, url);
    await page.setUserAgent(cluster.puppeteerOptions.userAgent);
    await page.goto(url, { waitUntil: 'networkidle0' });
    return streamURL;
  };

  try {
    logger.info('Enqueuing URL: %s', args.url);
    const streamURL = await args.puppeteer.execute(args, extractStream);
    logger.info(
      '%s stream %s in %s',
      args.ext,
      streamURL ? `found ${streamURL}` : 'not found',
      args.url
    );
    callback(null, streamURL);
  } catch (err) {
    logger.error(err);
    callback(null, null);
  }
};
