const Apify = require('apify')
const axios = require('axios')
const UserAgent = require('user-agents')
const userAgent = new UserAgent();
// const $ = require('jquery')

// const ZUMPER_PARSE_ENDPOINT = require(`./credentials/${process.env.NODE_ENV}/API_URLS`).ZUMPER_PARSE_ENDPOINT

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
    { ad_url: 'https://www.zumper.com/apartment-buildings/p213214/221-265-balliol-street-davisville-village-toronto-on' },
    // { ad_url: 'https://www.realtor.ca/real-estate/19891858/4-1-bedroom-single-family-house-5138-lakeshore-rd-w-burlington-appleby?' },
    // { ad_url: 'https://www.apartments.com/517-n-3rd-st-toronto-oh/brvnmkb/' },
    // { ad_url: 'https://www.zoocasa.com/toronto-on-real-estate/5799107-th117-500-richmond-st-w-toronto-on-m5v1y2-c4321563' },
    // { ad_url: 'https://www.torontorentals.com/toronto/kings-club-id60237' },
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
    persistStateKey: 'zumper-ad-scraping-state'
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

        // const extractImages = async ($) => {
        //   let imgs = []
        //   await $("img.listing-slider-content-photo-main").each((i, img) => {
        //      imgs.push(img.dataset.imgDeferSrc)
        //   })
        //   return imgs
        // }

        const extractPageContents = async ($, url) => {

          // opens zumper images
          // https://www.zumper.com/apartment-buildings/p213214/221-265-balliol-street-davisville-village-toronto-on
          // $('[aria-label]').click()
          // after click, you can grab all the images as thumbnails
          // const results = $('span[aria-label*="Go to Slide"] > div > img')
          // results.each((i) => {
          // 	console.log(results[i].src) // returns https://d37lj287rvypnj.cloudfront.net/172167044/small
          // })
          // to get the full image version, replace https://.../small with https://.../1280x960

          // grabs the zumper description
          // const aboutTitle = $("h2:contains('About')")[0].className
          // $(aboutTitle).parent().siblings().text()
          // note that .siblings() will give you everything, but only 1 of the divs are the description

          // similarly we can use the $(aboutTitle).parent().siblings().text() to get beds & amenities
          // 

          /*
            // grabs the ls+json schemas and opens them up
            var jsonLD = $$('script[type="application/ld+json"]');
            jsonLD[30].innerText = {
              "@context": "http://schema.org",
              "@type": "Apartment",
              "address": {
                "@context": "http://schema.org",
                "@type": "PostalAddress",
                "addressLocality": "Toronto",
                "addressRegion": "ON",
                "name": "Yonge & St. Clair #32158",
                "postalCode": "M4V 2Z3",
                "streetAddress": "Yonge & St. Clair #32158"
              },
              "name": "Apartments for Rent at Yonge & St. Clair #32158",
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 43.6797776059281,
                "longitude": -79.3992441074001
              },
              "url": "https://www.zumper.com/apartments-for-rent/34111682/2-bedroom-south-hill-toronto-on",
              "photo": "https://d37lj287rvypnj.cloudfront.net/259053161/medium",
              "containedInPlace": {
                "@context": "http://schema.org",
                "@type": "City",
                "address": {
                  "@context": "http://schema.org",
                  "@type": "PostalAddress",
                  "addressLocality": "Toronto",
                  "addressRegion": "ON"
                },
                "name": "Toronto",
                "url": "https://www.zumper.com/apartments-for-rent/toronto-on"
              }
            }
            $('script[type="application/ld+json"]').each( function(i) {
              if (i && i.innerText) {
                const schema = JSON.parse(i.innerText)
                if (schema && schema['@type'] && schema['@type'] !== 'City') {
                  console.log("---------- FEED ITEM -----------")
                  console.log(schema)
                  var scraped_obj = {
                      ad_url : schema.url,
                  }
                  results.push(scraped_obj);
                }
              }
            });
          */

          // const address_1 = await $("h1.address").text()
          // const address_2 = await $("section.listing-location > div > a:first-of-type").text()
          // const price = await $("section.listing-price > div:first-of-type > span.priv").text().replace('\n', '')
          // const description = await $("div.section-listing-content > div.section-listing-content-pad > span.priv > p:nth-of-type(2)").text()
          // const image_urls = await extractImages($)
          // const section_rooms = await $("section.section-listing input#acc-listing-rooms ~ *").text().replace(/[\t\n\r]/gm,' ').trim()
          await new Promise((res, rej) => setTimeout(res, 20000))

          const extraction = {
            // ad_id: await getProp(ad_id, 'textContent'),
            ad_url: url,
          }
          console.log(extraction)
          return extraction
        }
        return await extractPageContents(jQuery, url)
      }, request.url)
      console.log(extracted_details)
      return Promise.resolve(extracted_details)
      // const extracted_details = await extractPageContents(page, jQuery)
      // return sendToAPIGateway(extracted_details, ZUMPER_PARSE_ENDPOINT)
    },
    handleFailedRequestFunction: async ({ request }) => {
      await Apify.pushData({
          url: request.url,
          succeeded: false,
          errors: request.errorMessages,
      })
    },
    // modify the page before loading anything
    gotoFunction: async ({ request, page }) => {
      console.log('Starting the web scraping job for next page...')
      console.log(request.url)

      // hide the window.navigator property
      await Apify.utils.puppeteer.hideWebDriver(page);

      // Pass the Permissions Test.
      await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      // Pass the Plugins Length Test.
      await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
          // This just needs to have `length > 0` for the current test,
          // but we could mock the plugins too if necessary.
          get: () => [1, 2, 3, 4, 5],
        });
      });

      // Pass the Languages Test.
      await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });

      // fuck with the cookies
      const cookies = await page.cookies()
      // await page.setCookie(...cookies)
      // console.log('Successfully set cookies..')
      await page.deleteCookie(...cookies);
      // console.log('Successfully removed cookies..')

      // now go to the page
      return page.goto(request.url, { waitUntil: 'networkidle2', timeout: 60000 })
    },
    launchPuppeteerOptions: {
      useApifyProxy: true,
      userAgent: userAgent.toString(),
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
