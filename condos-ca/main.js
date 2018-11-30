const Apify = require('apify')
const axios = require('axios')
// const $ = require('jquery')

const CONDOSCA_PARSE_ENDPOINT = require(`./credentials/${process.env.NODE_ENV}/API_URLS`).CONDOSCA_PARSE_ENDPOINT

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
  const width = 375
  const height = 667

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
  const response = await Apify.client.crawlers.getExecutionResults({
      executionId: input._id
  })
  const data = response.items[0].pageFunctionResult
  console.log('------------------')
  console.log(data)
  console.log('------------------')
  console.log(process.env.NODE_ENV)
  console.log('------------------')
  // dev
  // const data = [
  //   { ad_url: 'https://condos.ca/toronto/st-lawrence-on-the-park-65-scadding-ave/unit-708-C4301810' },
  //   { ad_url: 'https://condos.ca/toronto/the-ninety-90-broadview-ave/unit-401-E4275451' }
  // ]

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

  const requestQueue = await Apify.openRequestQueue('condosca')

  const new_data = data.map(async (d) => {
    await requestQueue.addRequest(new Apify.Request({ url: d.ad_url }));
  })
  await Promise.all(new_data)

  const crawler = new Apify.PuppeteerCrawler({
    requestQueue,
    // NOTE: jQuery must be injected in order to use text locators. If jQuery is used, it cannot work alongside page.$()
    // and we must wrap it all inside page.evaluate()
    handlePageFunction: async ({page, request}) => {
      // await page.reload()
      console.log(` ------ Page Loaded --------`)
      // console.log(await page.cookies())
      const title = await page.title()
      console.log(`Title of ${request.url}: ${title}`)
      // inject jQuery into page
      await Apify.utils.puppeteer.injectJQuery(page)
      page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i)
          console.log(`${i}: ${msg.args()[i]}`);
      });

      const extracted_details = await page.evaluate(async (url) => {

        const extractImages = async ($) => {
          let imgs = []
          await $("div.swiper-wrapper div:not(.swiper-slide-duplicate) img").each((i, img) => {
             imgs.push(img.src)
          })
          return imgs
        }

        const extractPageContents = async ($, url) => {
          await $("div.top-post-details a.toggle-lnk").click()
          await $("div#accordiona a[href='#desc-mobi']").click()
          // const ad_id = await page.$("li[class*='currentCrumb-']"

          const address = $("h2.slide-address")
              .clone()    //clone the element
              .children() //select all the children
              .remove()   //remove all the children
              .end()  //again go back to selected element
              .text()
              .replace(',', '')
              .replace('in', '')
              .trim()

          let x = $("h2.slide-address").text().split(',')
          const city = $("h2.slide-address").text().split(',')[x.length - 1].trim()
          const full_address = address + ', ' + city

          const date_posted = await $("div.post-details-list p:contains('Date Listed') + div.info-value").text()
          const sqft = await $("div.post-details-list p:contains('MLS® Size') + div.info-value").text().replace(/[\t\n\r]/gm,' ').trim()
          const poster_name = await $("div#desc div.left").text()
          const title = await $("h1.slide-title").text().trim()
          const price = await $("div.top-post-details ul.post-list-1 > li:first-of-type").text().trim()
          const movein = await $("div.post-details-list p:contains('Date Available') + div.info-value").text()
          const description = await $("div#desc").text().trim()
          const image_urls = await extractImages($)
          const mls_num = await $("div#desc div.right").text().trim()
          const beds = await $("div.top-post-details ul.post-list-1 li:contains('Beds')").text().trim()
          const baths = await $("div.top-post-details ul.post-list-1 li:contains('Bath')").text().trim()

          await $("li[role='presentation'] > a > span:contains('Amenities')").click()
          const section_amenities = $("div#amenIcons").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_utils = $("div#maintIcons").text().replace(/[\t\n\r]/gm,' ').trim()

          const extraction = {
            // ad_id: await getProp(ad_id, 'textContent'),
            ad_url: url,
            date_posted: date_posted,
            poster_name: poster_name,
            title: title,
            sqft: sqft,
            movein: movein,
            address: full_address,
            price: price,
            description: description,
            images: image_urls,
            mls_num: mls_num,
            beds: beds,
            baths: baths,
            section_amenities,
            section_utils,
          }
          console.log(extraction)
          return extraction
        }
        return await extractPageContents(jQuery, url)
      }, request.url)
      console.log(extracted_details)
      // const extracted_details = await extractPageContents(page, jQuery)
      await sendToAPIGateway(extracted_details, CONDOSCA_PARSE_ENDPOINT)
      // await requestQueue.markRequestHandled(request);
      // return 'next'
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
      await page.viewport({ width, height })
      const cookies = await page.cookies()
      // await page.setCookie(...cookies)
      // console.log('Successfully set cookies..')
      await page.deleteCookie(...cookies);
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
    // data = {}
    /*
        data = { ad_url: 'https://condos.ca/toronto/the-ninety-90-broadview-ave/unit-401-E4275451',
  date_posted: '2018-10-12',
  poster_name: 'Broker: CHESTNUT PARK REAL ESTATE LIMITED, BROKERAGE',
  title: 'The Ninety,  Unit 401',
  sqft: '1000-1199 sqft',
  movein: 'Immediate',
  address: '90 Broadview Ave, Toronto',
  price: 'Rental Price $2,875',
  description: 'Loft Living At The Ninety. 1 Bedroom + Den. Over 1,000 Sqft W/Spacious Combined Living And Dining Area. Exposed Concrete, Stainless Steel Appliances, Ensuite Washer & Dryer And Gas Stove! Engineered Hardwood Floors, Walk-In Closet, Ensuite Bathroom. Steps To The Best Restaurants, Shops, Bars, Galleries, Ttc, Leslieville, Corktown, Distillery District. Heat Pump Rental $39.74.EXTRAS:Fridge, Stove, Dishwasher, Washer, Dryer, All Elfs, Window Coverings. Heat Pump Rental $39.74.\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\tBroker: CHESTNUT PARK REAL ESTATE LIMITED, BROKERAGE\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\t      MLS®# E4275451',
  images:
   [ 'https://condos.ca/public/condo_listing/9a/77/56/02/24fd177_3aa4.jpg',
     'https://condos.ca/public/condo_listing/9f/77/56/02/24fd17c_7a34.jpg',
     'https://condos.ca/public/condo_listing/a4/77/56/02/24fd181_53df.jpg',
     'https://condos.ca/public/condo_listing/a9/77/56/02/24fd186_af64.jpg',
     'https://condos.ca/public/condo_listing/ae/77/56/02/24fd18b_8241.jpg',
     'https://condos.ca/public/condo_listing/b3/77/56/02/24fd190_0c69.jpg',
     'https://condos.ca/public/condo_listing/b8/77/56/02/24fd195_3188.jpg',
     'https://condos.ca/public/condo_listing/bd/77/56/02/24fd19a_71f8.jpg',
     'https://condos.ca/public/condo_listing/c2/77/56/02/24fd19f_612c.jpg',
     'https://condos.ca/public/condo_listing/c7/77/56/02/24fd1a4_a08d.jpg',
     'https://condos.ca/public/condo_listing/cc/77/56/02/24fd1a9_c3f5.jpg',
     'https://condos.ca/public/condo_listing/d1/77/56/02/24fd1ae_8c8f.jpg' ],
  mls_num: 'MLS®# E4275451',
  beds: 'Beds 1',
  baths: 'Bath 2',
  section_amenities: 'Common Rooftop Deck Concierge Public Transit Party Room Visitor Parking BBQs Outdoor Patio / Garden Parking Garage Pet Restrictions Games / Recreation Room Security Guard Enter Phone System',
  section_utils: 'Air Conditioning Common Element Maintenance Heat Building Insurance Water' }
    */
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
