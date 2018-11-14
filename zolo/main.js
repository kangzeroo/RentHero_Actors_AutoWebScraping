const Apify = require('apify')
const cssesc = require('cssesc')
const axios = require('axios')
// const $ = require('jquery')
const jsesc = require('jsesc')

const stage = 'development'
const KIJIJI_PARSE_ENDPOINT = require(`./credentials/${stage}/API_URLS`).KIJIJI_PARSE_ENDPOINT

Apify.main(async () => {
  const input = await Apify.getValue('INPUT');

  /*
    input = {
      "useApifyProxy": true,
      "username": "junell.thebest1@gmail.com",
      "password": "Finding1@3",
      "minConcurrency": 1,
      "maxConcurrency": 5,
      "maxRequestsPerCrawl": 5
    }
  */

  // Viewport && Window size
  const width = 1920
  const height = 1080

  // const browser = await puppeteer.launch({
  //     headless: false,
  //     args: [
  //         `--window-size=${ width },${ height }`
  //     ],
  // });


  // first we grab the login cookie
  // console.log('Launching Initial Puppeteer...')
  // const browser = await Apify.launchPuppeteer({
  //   useApifyProxy: true,
  //   apifyProxyGroups: ['SHADER', 'BUYPROXIES63748', 'BUYPROXIES63811', 'BUYPROXIES94952'],
  //   liveView: false,
  //   useChrome: true,
  //   args: [
  //       `--window-size=${ width },${ height }`
  //   ],
  // });
  //
  // const page = await browser.newPage();
  //
  // await page.viewport({ width, height })
  // await page.goto('https://www.zolo.ca/toronto-real-estate');
  // // Login
  // console.log('Logging In to Zolo...')
  // await page.waitForSelector("button.drawer-menu-toggle")
  // await page.click('button.drawer-menu-toggle')
  // await Apify.utils.sleep(1000);
  // await page.waitForSelector("button.signup-btn")
  // await page.click('button.signup-btn')
  // await Apify.utils.sleep(1000);
  // await page.waitForSelector("input[name='emailaddress']")
  // await page.waitForSelector("button#submitEmail")
  // await page.type("input[name='emailaddress']", input.email || 'huang.khan74@gmail.com')
  // await Apify.utils.sleep(1000);
  // await page.click('button#submitEmail')
  // await Apify.utils.sleep(5000);
  // // // Get cookies
  // const cookies = await page.cookies()
  // console.log(` ------ login cookies grabbed --------`)
  // console.log(cookies)

  // then we crawl over the array
  // prod
  // const response = await Apify.client.crawlers.getExecutionResults({
  //     executionId: input._id
  // })
  // const data = response.items[0].pageFunctionResult
  // console.log(data)
  // dev
  const data = [
    { ad_url: 'https://www.zolo.ca/toronto-real-estate/31-bales-avenue/911' },
    { ad_url: 'https://www.zolo.ca/toronto-real-estate/121-alfred-avenue' }
  ]

  // create a list of requests
  const dtt = data.map((d) => {
    return {
      url: d.ad_url
    }
  })
  console.log(dtt)
  const requestList = new Apify.RequestList({
    sources: dtt,
    persistStateKey: 'zolo-ad-scraping-state'
  })
  // This call loads and parses the URLs from the remote file.
  await requestList.initialize()

  const crawler = new Apify.PuppeteerCrawler({
    requestList,
    // NOTE: jQuery must be injected in order to use text locators. If jQuery is used, it cannot work alongside page.$()
    // and we must wrap it all inside page.evaluate()
    handlePageFunction: async ({page, request}) => {
      // await page.reload()
      console.log(` ------ Page Loaded --------`)
      // console.log(await page.cookies())
      const title = await page.title()
      console.log(`Title of ${request.url}: ${title}`)
      // inject jQuery into page
      const x = await Apify.utils.puppeteer.injectJQuery(page)
      page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i)
          console.log(`${i}: ${msg.args()[i]}`);
      });

      const extracted_details = await page.evaluate(async () => {

        const extractImages = async ($) => {
          let imgs = []
          await $("img.listing-slider-content-photo-main").each((i, img) => {
             imgs.push(img.dataset.imgDeferSrc)
          })
          return imgs
        }

        const extractPageContents = async ($) => {
          await $('button.expandable-toggle').click()
          // const ad_id = await page.$("li[class*='currentCrumb-']")
          const date_posted = await $("dt.column-label:contains('Added to Zolo') + dd.column-value").text()
          const poster_name = await $("dt.column-label:contains('Listed By') + dd.column-value").text()
          const title = await $("h1.address").text()
          const address_1 = await $("h1.address").text()
          const address_2 = await $("section.listing-location > div > a:first-of-type").text()
          const price = await $("section.listing-price > div:first-of-type > span.priv").text().replace('\n', '')
          const description = await $("div.section-listing-content > div.section-listing-content-pad > span.priv > p:nth-of-type(2)").text()
          const image_urls = await extractImages($)
          const mls_num = await $("dt.column-label:contains('MLS®#') + dd.column-value").text()
          const unit_style_1 = $("dt.column-label:contains('Type') + dd.column-value").text()
          const unit_style_2 = $("dt.column-label:contains('Style') + dd.column-value").text()
          const beds = $("section.listing-location > ul.list-unstyled > li:nth-of-type(1)").text()
          const baths = $("section.listing-location > ul.list-unstyled > li:nth-of-type(2)").text()

          const extraction = {
            // ad_id: await getProp(ad_id, 'textContent'),
            date_posted: date_posted,
            poster_name: poster_name,
            title: title,
            address: address_1 + " " + address_2,
            price: price,
            description: description,
            images: image_urls,
            mls_num: mls_num,
            unit_style: unit_style_1 + " " + unit_style_2,
            beds: beds,
            baths: baths,
          }
          console.log(extraction)
          return extraction
        }
        return await extractPageContents(jQuery)
      })
      console.log(extracted_details)
      // const extracted_details = await extractPageContents(page, jQuery)
      return sendToAPIGateway(extracted_details, KIJIJI_PARSE_ENDPOINT)
    },
    handleFailedRequestFunction: async ({ request }) => {
      await Apify.pushData({
          url: request.url,
          succeeded: false,
          errors: request.errorMessages,
      })
    },
    gotoFunction: async ({ request, page }) => {
      console.log('Starting the web scraping job for next page...')
      console.log(request.url)
      // await page.setCookie(...cookies)
      // console.log('Successfully set cookies..')
      // await page.deleteCookie(...cookies);
      // console.log('Successfully removed cookies..')
      return page.goto(request.url, { waitUntil: 'networkidle2', timeout: 60000 })
    },
    launchPuppeteerOptions: {
      useApifyProxy: true,
      // apifyProxyGroups: ['SHADER', 'BUYPROXIES63748', 'BUYPROXIES63811', 'BUYPROXIES94952'],
      // liveView: false,
      // useChrome: false,
    },
    minConcurrency: input.minConcurrency || 1,
    maxConcurrency: input.maxConcurrency || 1,
    maxRequestsPerCrawl: input.maxRequestsPerCrawl || 100,
  })
  await crawler.run()
})



const sendToAPIGateway = async (data, endpoint) => {
  const p = new Promise((res, rej) => {
    console.log(`Sending data to endpoint: ${endpoint}`)
    axios.post(endpoint, data)
      .then((data) => {
        console.log('Successfully sent info to API Gateway!')
        res(data)
      })
      .catch((err) => {
        console.log(err)
        rej(err)
      })
  })
  return p
}
