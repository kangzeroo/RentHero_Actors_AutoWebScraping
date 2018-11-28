const Apify = require('apify');
const request = require('request-promise')
const fs = require('fs')
const path = require('path')

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');

    // if (!input || !input.username || !input.password) throw new Error('INPUT must contain a kijiji username and password!');
    const url = 'https://www.kijiji.ca/t-login.html'

    input.username = 'junell.thebest1@gmail.com'
    input.password = 'Finding1@3'
    input.title = 'This is my title'
    input.category = 'Apartments & Condos for Rent'
    input.subcategory = '1 Bedroom'
    input.province = 'Ontario (M - Z)'
    input.region = 'Toronto (GTA)'
    input.city = 'City of Toronto'
    input.price = '900'
    input.description = 'Hello world whats up'
    input.baths = '1.5 bathrooms'
    input.furnished = true
    input.pets = true
    input.location = 'Toronto'
    input.phone = '5194663459'
    input.images = ['https://www.codeproject.com/KB/files/FastBinaryFileInput/screenshot.JPG', 'https://user-images.githubusercontent.com/32681199/32713932-c5b58944-c84b-11e7-95d5-bbad9da6de6b.png', 'https://i.stack.imgur.com/jT8iZ.png']


    // grab all image paths
    const allImages = input.images.map(async (img_url, index) => {
      const fileData = await request({
          uri: img_url,
          encoding: null
      })
      const image_path = `./assets/img_${index}.jpg`
      await fs.writeFileSync(image_path, fileData)
      return image_path
    })
    const all_images_paths = await Promise.all(allImages)
    console.log(all_images_paths)
    console.log('----------------------')

    // Launch Puppeteer
    console.log('Launching Puppeteer...');
    const browser = await Apify.launchPuppeteer({
      useApifyProxy: true,
      apifyProxyGroups: ['SHADER', 'BUYPROXIES63748', 'BUYPROXIES63811', 'BUYPROXIES94952'],
      liveView: false,
      useChrome: false,
    });
    console.log(`Opening page ${url}...`);
    const page = await browser.newPage();
    // Inject jQuery
    await Apify.utils.puppeteer.injectJQuery(page)

    // Check if login cookies exist
    const store = await Apify.openKeyValueStore('LOGIN_CREDS')
    const existing_cookies = await store.getValue('COOKIES');
    if (existing_cookies) {
      console.log('Existing cookies found... injecting into Kijiji...')
      // Inject the cookies
      await page.setCookie(...existing_cookies.cookies)
    } else {
      // Grab the cookies ourselves
      // Login
      console.log('Logging in to Kijiji...')
      await page.goto(url);
      await page.type('#LoginEmailOrNickname', input.username || 'junell.thebest1@gmail.com')
      await page.type('#login-password', input.password || 'Finding1@3')
      await page.click('button#SignInButton')
      await new Promise((res, rej) => setTimeout(res, 3000))

      // Get cookies
      const cookies = await page.cookies()
      console.log(` ------ login cookies grabbed --------`)
      console.log(`${cookies.length} cookies found`)
      // Save cookies to local key-value store
      await store.setValue('COOKIES', { cookies: cookies })
    }

    // Establish that jQuery exists from global scope
    // If we want to use jQuery we need to use page.evaluate()
    // However in order to see console.logs within page.evaluate() we need the below event listener
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`)
    })
    // And now we can use page.evaluate() to access jQuery
    // const example_text = await page.evaluate(async ({ input }) => {
    //   const $ = jQuery
    //   console.log('This will be logged thanks to the event listener')
    //   await new Promise((res, rej) => setTimeout(res, 1000))
    //   return $('input#example').text();
    // }, { input })

    // Let's post an ad
    await page.goto('https://www.kijiji.ca/p-select-category.html')
    await page.type('textarea#AdTitleForm', input.title)

    // await page.setRequestInterception(true);
    // page.on('request', interceptedRequest => {
    //   console.log('-------- INTERCEPTED URL')
    //   console.log(interceptedRequest.url())
    //   interceptedRequest.continue();
    // });

    await Apify.utils.sleep(2000)
    await page.evaluate(async ({ input }) => {
      const $ = jQuery

      await $("button[class*='titleButton']").click()
      await new Promise((res, rej) => setTimeout(res, 1000))
      await $("ul > li > button > h5:contains('Real Estate')").click()
      await new Promise((res, rej) => setTimeout(res, 1000))
      await $(`ul > li > button > h5:contains("${input.category}")`).click()
      await new Promise((res, rej) => setTimeout(res, 1000))
      await $(`ul > li > button > h5:contains("${input.subcategory}")`).click()
      // wait for redirect (or intercept if needed)
      // see forum https://forum.apify.com/t/how-to-crawl-a-domain-if-it-redirects/55
      console.log('Finished categories, redirecting...')
    }, { input })

    // After redirect, select location
    console.log('... After redirect. Now at location.')
    await new Promise((res, rej) => setTimeout(res, 3000))
    await page.waitForSelector('div#MainContainer')
    await page.evaluate(async ({ input }) => {
      const $ = jQuery
      await $(`a:contains('${input.province}')`).click()
      await new Promise((res, rej) => setTimeout(res, 500))
      await $(`a:contains('${input.region}')`).click()
      await new Promise((res, rej) => setTimeout(res, 500))
      await $(`a:contains('${input.city}')`).click()
      await new Promise((res, rej) => setTimeout(res, 500))
      await $("a#LocUpdate").click()
      console.log('Finished location, redirecting...')
    }, { input })


    // After redirect, select location
    console.log('... After redirect. Now at ad description.')
    await page.waitForSelector('form#PostAdMainForm')
    await page.type('input#postad-title', input.title)
    await page.type('input#PriceAmount', input.price)
    await page.type('textarea#pstad-descrptn', input.description)
    await page.select('select#numberbathrooms_s', kijijify_baths(input.baths))
    // if (!$("select#numberbedrooms_s").attr("disabled")) {
    //   await page.select('select#numberbedrooms_s', kijijify_beds(input.beds))
    // }
    await page.evaluate(async ({ input }) => {
      const $ = jQuery
      if (input.furnished) {
        await $("input#furnished_s").click()
      } else {
        await $("input#furnished_s-1").click()
      }
      if (input.pets) {
        await $("input#petsallowed_s").click()
      } else {
        await $("input#petsallowed_s-1").click()
      }
    }, { input })

    await page.type("input#addressStreetNumber", '123')
    await page.type("input#addressStreetName", 'McLaughin')
    await page.type("input#AddressCity", 'Toronto')
    await page.type("input#addressPostalCode", 'L5D 4G8')
    await page.waitForSelector('select#locationLevel0')
    await page.select('select#locationLevel0', kijijify_location(input.location))

    await page.waitForSelector('ol#MediaUploadedImages > li.pic-placeholder')
    // await page.click("ol#MediaUploadedImages > li.pic-placeholder")
    const imageUpload = await page.$('input[type="file"]')

    // const all_image_paths = all_images_paths.reduce((acc, current_val) => {
    //   const pth = `${acc},${path.join(__dirname, current_val[1:current_val.length - 1])}`
    //   console.log(pth)
    //   return pth
    // }, path.join(__dirname, all_images_paths[0][1:all_images_paths[0].length - 1]))
    // console.log(all_image_paths)
    console.log('----------------------')

    const uploadImages = await all_images_paths.map(async (img_path) => {
      console.log(`---------- Uploading ${img_path} ------------`)
      await imageUpload.uploadFile(img_path);
    })
    await Promise.all(uploadImages)
    console.log('---------- SUCCESSFULLY UPLOADED ALL ------------')

    await page.type("input#PhoneNumber", input.phone)
    await page.click("div[class*='lowerDetailsContainer'] > div > button")

    await Apify.utils.sleep(1000000)
    console.log('Closing Puppeteer...');
    await browser.close();


    console.log('Done.');
});

const kijijify_baths = (text) => {
  if (text.indexOf('1 bathroom') > -1) {
    return '10'
  } else if (text.indexOf('1.5 bathrooms') > -1) {
    return '15'
  } else if (text.indexOf('2 bathrooms') > -1) {
    return '20'
  } else if (text.indexOf('2.5 bathrooms') > -1) {
    return '25'
  } else if (text.indexOf('3 bathrooms') > -1) {
    return '30'
  } else if (text.indexOf('3.5 bathrooms') > -1) {
    return '35'
  } else if (text.indexOf('4 bathrooms') > -1) {
    return '40'
  } else if (text.indexOf('4.5 bathrooms') > -1) {
    return '45'
  } else if (text.indexOf('5 bathrooms') > -1) {
    return '50'
  } else if (text.indexOf('5.5 bathrooms') > -1) {
    return '55'
  } else if (text.indexOf('6 or more bathrooms') > -1) {
    return '60'
  }
}

const kijijify_location = (text) => {
  if (text.toLowerCase().indexOf('toronto') > -1) {
    return '1700273'
  } else if (text.toLowerCase().indexOf('markham') > -1) {
    return '1700274'
  } else if (text.toLowerCase().indexOf('oshawa') > -1) {
    return '1700275'
  } else if (text.toLowerCase().indexOf('mississauga') > -1) {
    return '1700276'
  } else if (text.toLowerCase().indexOf('oakville') > -1) {
    return '1700277'
  }
}
