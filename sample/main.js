const Apify = require('apify');
const $ = require('jquery')

Apify.main(async () => {
    // input is the url to list of kijiji search results
    const input = await Apify.getValue('INPUT')
    // a seperate queue for pagination
    const requestQueue = await Apify.openRequestQueue('kijiji-listings')
    await requestQueue.addRequest(new Apify.Request({ url: input.url }))
    const pseudoUrls = [new Apify.PseudoUrl(input.purl)]
    // a seperate queue for the ads
    const requestQueue_Ads = await Apify.openRequestQueue('kijiji-ad-urls')
    // initiate the crawler
    const crawler = new Apify.PuppeteerCrawler({
      requestQueue,
      handlePageFunction: async ({page, request}) => {
        const title = await page.title();
        console.log(`Title of ${request.url}: ${title}`);
        // save each ad to its own queue
        const items = await saveAdsToQueue(page, requestQueue_Ads)
        console.log(items)
        console.log(items.length)
        // paginate through the kijiji search results
        await Apify.utils.puppeteer.enqueueLinks(page, "a[title='Next']", pseudoUrls, requestQueue);
      },
      handleFailedRequestFunction: async ({ request }) => {
        await Apify.pushData({
          url: request.url,
          succeeded: false,
          errors: request.errorMessages,
        })
      },
      maxRequestsPerCrawl: 2,
      maxConcurrency: 1,
    })
    await crawler.run()
})

const saveAdsToQueue = async (page, requestQueue_Ads) => {
  const results = [];
  const items = await page.$$('div.search-item .info-container > .title > a')
  const urls = items.map(async (item) => {
    const url = await item.getProperty('href')
    const actual = await url.jsonValue()
    return await requestQueue_Ads.addRequest(new Apify.Request({ url: actual }))
  })
  return Promise.all(urls)
}
