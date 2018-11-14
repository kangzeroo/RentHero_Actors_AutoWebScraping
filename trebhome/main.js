const Apify = require('apify');
const randomUA = require('modern-random-ua');

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');

    // if (!input || !input.url) throw new Error('INPUT must contain a url!');
    const url = 'https://listings.trebhome.com'

    console.log('Launching Puppeteer...');
    const browser = await Apify.launchPuppeteer({
      // useApifyProxy: true,
      useChrome: true,
      userAgent: randomUA.generate()
    });

    console.log(`Opening page ${url}...`);
    const page = await browser.newPage();
    await Apify.utils.puppeteer.hideWebDriver(page)
    const cookies = await page.cookies(url)
    await page.deleteCookie(...cookies)
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    // const title = await page.title();
    // console.log(`Loaded the page "${title}".`);
    await new Promise((res, rej) => setTimeout(res, 60000))

    // the action
    // await page.waitForSelector("button[name='accepted']")
    // const acceptTerms = await page.$("button[name='accepted']")[0]
    // if (acceptTerms) {
    //   await acceptTerms.click()
    //   await new Promise((res, rej) => setTimeout(res, 3000))
    // } else {
    //   console.log('Did not find accept terms')
    // }
    //
    //
    // console.log('Closing Puppeteer...');
    // await browser.close();

    // console.log('Done.');
});
