const Apify = require('apify')
const cssesc = require('cssesc')
const axios = require('axios')
// const $ = require('jquery')
const jsesc = require('jsesc')

const ZOLO_PARSE_ENDPOINT = require(`./credentials/${process.env.NODE_ENV}/API_URLS`).ZOLO_PARSE_ENDPOINT

Apify.main(async () => {
  // prod
  // const input = await Apify.getValue('INPUT');


  // dev
  const input = {
    "useApifyProxy": true,
    "username": "junell.thebest1@gmail.com",
    "password": "Finding1@3",
    "minConcurrency": 1,
    "maxConcurrency": 5,
    "maxRequestsPerCrawl": 5
  }


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
  // console.log('------------------')
  // console.log(response.items.length)
  // console.log('------------------')
  // // console.log(response.items[0])
  // const data = []
  // response.items.forEach((item) => {
  //   if (item.pageFunctionResult) {
  //     item.pageFunctionResult.forEach((r) => {
  //       data.push(r)
  //     })
  //   }
  // })
  // console.log('------------------')
  // console.log(data)
  // console.log(`Found ${data.length} entries`)
  // console.log('------------------')
  // console.log(process.env.NODE_ENV)
  // console.log('------------------')
  // dev
  const data = [
    { ad_url: 'https://www.zolo.ca/toronto-real-estate/628-fleet-street/2803' },
    { ad_url: 'https://www.zolo.ca/toronto-real-estate/628-fleet-street/2803' }
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

      const extracted_details = await page.evaluate(async (url) => {

        const extractImages = async ($) => {
          let imgs = []
          await $("img.listing-slider-content-photo-main").each((i, img) => {
             imgs.push(img.dataset.imgDeferSrc)
          })
          return imgs
        }

        const extractPageContents = async ($, url) => {
          await $('button.expandable-toggle').click()
          await $("label[for='acc-listing-details']").click()
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
          const pets = await $("dt.column-label:contains('Pets') + dd.column-value").text()
          const section_parking = await $("div.column-container > h4.column-title:contains('Parking') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_property = await $("div.column-container > h4.column-title:contains('Property') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_fees = await $("div.column-container > h4.column-title:contains('Fees') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_inside = await $("div.column-container > h4.column-title:contains('Inside') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_building = await $("div.column-container > h4.column-title:contains('Building') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_rental = await $("div.column-container > h4.column-title:contains('Rental') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_land = await $("div.column-container > h4.column-title:contains('Land') ~ div").text().replace(/[\t\n\r]/gm,' ').trim()
          const section_rooms = await $("section.section-listing input#acc-listing-rooms ~ *").text().replace(/[\t\n\r]/gm,' ').trim()


          const extraction = {
            // ad_id: await getProp(ad_id, 'textContent'),
            ad_url: url,
            date_posted: date_posted,
            poster_name: poster_name,
            title: title,
            address: address_1 + " " + address_2,
            price: price,
            description: description,
            images: image_urls,
            mls_num: `MLS# ${mls_num}`,
            unit_style: unit_style_1 + " " + unit_style_2,
            beds: beds,
            baths: baths,
            pets: pets,
            section_parking,
            section_property,
            section_fees,
            section_inside,
            section_building,
            section_rental,
            section_land,
            section_rooms,
          }
          console.log(extraction)
          return extraction
        }
        return await extractPageContents(jQuery, url)
      }, request.url)
      console.log(extracted_details)
      return sendToAPIGateway(extracted_details, ZOLO_PARSE_ENDPOINT)
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
        data = { ad_url: 'https://www.zolo.ca/toronto-real-estate/31-bales-avenue/911',
  date_posted: 'Nov 13, 2018',
  poster_name: 'Royal Lepage Terrequity Elite Realty, Brokerage',
  title: '911 - 31 Bales Avenue',
  address: '911 - 31 Bales Avenue Toronto',
  price: '$2,650 ',
  description: 'This condo apt home located at 31 Bales Avenue, Toronto is currently for rent and has been available on Zolo.ca for 1 day. It has 2 beds, 2 bathrooms, and is 800-899 square feet. 31 Bales Avenue, Toronto is in the Willowdale East neighborhood Toronto. Lansing Westgate, Newtonbrook East and Willowdale West are nearby neighborhoods. ',
  images:
   [ 'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-1.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-1.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-10.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-11.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-12.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-13.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-14.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-15.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-16.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-2.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-3.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-4.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-5.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-6.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-7.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-8.jpg?2018-11-14+10%3A18%3A30',
     'https://photos.zolo.ca/911-31-bales-avenue-toronto-c4302100-photo-9.jpg?2018-11-14+10%3A18%3A30' ],
  mls_num: 'C4302100',
  unit_style: 'Condo Apt Apartment',
  beds: '2 Bed',
  baths: '2 Bath',
  pets: 'Restrict',
  section_parking: 'Garage Undergrnd  Parking Places 1  Covered Parking Places 1',
  section_property: 'Type Condo Apt  Style Apartment  Size (sq ft) 800-899  Property Type Residential  Area Toronto  Community Willowdale East  Availability Date 12/15/18',
  section_fees: 'Building Insurance Included Yes  Common Elements Included Yes  Parking Included Yes',
  section_inside: 'Bedrooms 2  Bathrooms 2  Kitchens 1  Rooms 5  Patio Terrace Open  Air Conditioning Central Air',
  section_building: 'Pets Restrict  Stories 9  Heating Forced Air  Private Entrance Yes',
  section_rental: 'Furnished N',
  section_land: 'Fronting On Se  Cross Street Yonge/Sheppard  Municipality District Toronto C14',
  section_rooms: 'Rooms Room details for 911 - 31 Bales Avenue: size, flooring, features etc.       Living Flat   10 x 15 151 sqft  Combined W/Dining, South View, W/O To Balcony   Dining Flat   10 x 8 75 sqft  Combined W/Living   Kitchen Flat   8 x 13 97 sqft  Eat-In Kitchen   Master Flat   15 x 12 183 sqft  W/I Closet   2nd Br Flat   10 x 13 129 sqft' }
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
