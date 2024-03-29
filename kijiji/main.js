const Apify = require('apify')
const axios = require('axios')
const $ = require('jquery')

const KIJIJI_PARSE_ENDPOINT = require(`./credentials/${process.env.NODE_ENV}/API_URLS`).KIJIJI_PARSE_ENDPOINT

Apify.main(async () => {

  const loginAccounts = [
    { username: 'junell.thebest1@gmail.com', password: 'Finding1@3' },
    { username: 'paterno.thefast2@gmail.com', password: 'Searching!23' },
    { username: 'dexter.theflex3@gmail.com', password: 'alnsd@dsf8' },
    { username: 'yurisovachinko@yandex.com', password: 'Convention@99' },
    { username: 'rhona.abbott@yandex.com', password: 'Convention@99' },
    { username: 'leroy.whitney@yandex.com', password: 'Convention@99' },
    { username: 'naima.gentry@yandex.com', password: 'Convention@99' },
  ]

  // prod
  const input = await Apify.getValue('INPUT');


    // dev
    // const input = {
    //   "useApifyProxy": true,
    //   "username": "junell.thebest1@gmail.com",
    //   "password": "Finding1@3",
    //   "minConcurrency": 1,
    //   "maxConcurrency": 5,
    //   "maxRequestsPerCrawl": 5
    // }


  // first we grab the login cookie
  console.log('Launching Initial Puppeteer...')
  const browser = await Apify.launchPuppeteer({
    useApifyProxy: true,
    apifyProxyGroups: ['SHADER', 'BUYPROXIES63748', 'BUYPROXIES63811', 'BUYPROXIES94952'],
    liveView: false,
    useChrome: false,
  });
  const page = await browser.newPage();
  await page.goto('https://www.kijiji.ca/t-login.html');
  // Login
  console.log('Logging In to Kijiji...')
  const randomAccount = loginAccounts[Math.floor(Math.random() * loginAccounts.length)]
  await page.type('#LoginEmailOrNickname', input.username || randomAccount.username)
  await page.type('#login-password', input.password || randomAccount.password)
  await page.click('button#SignInButton')
  await new Promise((res, rej) => setTimeout(res, 3000))
  // Get cookies
  const cookies = await page.cookies()
  console.log(` ------ login cookies grabbed --------`)
  console.log(cookies)

  // then we crawl over the array
  // prod
  const response = await Apify.client.crawlers.getExecutionResults({
      executionId: input._id
  })
  console.log('------------------')
  console.log(response.items.length)
  console.log('------------------')
  console.log(response.items)
  const data = []
  response.items.forEach((item) => {
    if (item.pageFunctionResult) {
      item.pageFunctionResult.forEach((r) => {
        data.push(r)
      })
    }
  })
  console.log('------------------')
  console.log(data)
  console.log(`Found ${data.length} entries`)
  console.log('------------------')
  console.log(process.env.NODE_ENV)
  console.log('------------------')
  // dev
  // const data = [
  //   { ad_url: 'https://www.kijiji.ca/v-apartments-condos/mississauga-peel-region/2-bedroom-condo-for-rent-in-mississauga-near-square-one/1394383312?enableSearchNavigationFlag=true' },
  //   { ad_url: 'https://www.kijiji.ca/v-house-rental/city-of-toronto/brand-new-deluxe-townhouse-queen-west-area/1401946336?enableSearchNavigationFlag=true' },
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
    persistStateKey: 'kijiji-ad-scraping-state'
  });
  // This call loads and parses the URLs from the remote file.
  await requestList.initialize()

  const crawler = new Apify.PuppeteerCrawler({
    requestList,
    handlePageFunction: async ({page, request}) => {
      // await page.reload()
      console.log(` ------ Page Loaded --------`)
      // console.log(await page.cookies())
      const title = await page.title()
      console.log(`Title of ${request.url}: ${title}`)
      const extracted_details = await extractPageContents(page, request.url)
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
      // const cookies = await page.cookies()
      await page.setCookie(...cookies)
      console.log('Successfully set cookies..')
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
    maxRequestsPerCrawl: input.maxRequestsPerCrawl || 300,
  })
  await crawler.run()
})

const extractPageContents = async (page, url) => {
  const ad_id = await page.$("li[class*='currentCrumb-']")
  const date_posted = await page.$("time")
  await new Promise((res, rej) => setTimeout(res, 1000))
  const poster_name = await page.$("[class*='link-']")
  const title = await page.$("h1[class*='title-']")
  const address = await page.$("span[class*='address-']")
  const price = await page.$("span[class*='currentPrice-']")
  const details = await page.$$("dl[class*='itemAttribute-']")
  const description = await page.$("div[class*='descriptionContainer-'] > div > p")
  const phone = await extractPhone(page)
  const image_urls = await extractImages(page)

  const extraction = {
    ad_url: url,
    ad_id: await getProp(ad_id, 'textContent'),
    date_posted: await getProp(date_posted, 'title'),
    poster_name: await getProp(poster_name, 'textContent'),
    title: await getProp(title, 'textContent'),
    address: await getProp(address, 'textContent'),
    price: await getProp(price, 'textContent'),
    details: await Promise.all(details.map(async (dt) => {
      return await getProp(dt, 'textContent')
    })),
    description: await getProp(description, 'textContent'),
    images: image_urls,
    phone: phone,
  }
  console.log(extraction)
  return extraction
}

const extractImages = async (page) => {
  const openImageDiv = await page.$("div#mainHeroImage")
  if (openImageDiv) {
    await openImageDiv.click()
  }
  await new Promise((res, rej) => setTimeout(res, 1000))
  const thumbnails = await page.$$("button[class*='thumbnail']")
  console.log('--------- thumbnails ---------')
  // console.log(thumbnails.length)
  for (const thumbnail of thumbnails) {
    const url = await thumbnail.click()
    await new Promise((res, rej) => setTimeout(res, 500))
  }
  console.log('--------- images ---------')
  const images = await page.$$("img[class*='image']")
  // console.log(images.length)
  const image_urls = await Promise.all(images.map(async (img) => {
    return await getProp(img, 'src')
  }))
  console.log('--------- image_urls ---------')
  // console.log(image_urls)
  return image_urls
}

const extractPhone = async (page) => {
  const phoneBlock = await page.$("button[class*='phoneNumberContainer']")
  if (phoneBlock) {
    await phoneBlock.click()
  }
  await new Promise((res, rej) => setTimeout(res, 1000))
  // console.log(phoneBlock)
  const phone = await page.$("span[class*='phoneShowNumberButton']")
  if (phone) {
    return await getProp(phone, 'textContent')
  } else {
    return ''
  }
}

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

const getProp = async (elementHandle, propertyName) => {
  if (elementHandle && propertyName) {
    const jsHandle = await elementHandle.getProperty(propertyName)
    const propName = await jsHandle.jsonValue()
    return propName
  } else {
    return ''
  }
}
