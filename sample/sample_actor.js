const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');

    /*
      input = {
          "url": "https://www.amazon.com",
          "product": "go pro",
          "count": 20
      }
    */

    if (!input || !input.url) throw new Error('INPUT must contain a url!');

    const browser = await Apify.launchPuppeteer({headless: true});
    const page = await browser.newPage();

    await page.goto(input.url, { waitUntil: 'networkidle2', timeout: 3000000 });
    //
    // await page.type('#twotabsearchtextbox', `${input.product}`)
    // await page.click('input.nav-input')
    // await page.waitForSelector('div#resultsCol')
    // await page.waitFor(10000)
    //
    // let urls = [];
    // while(true){
    //   if(urls.length >= input.count) break
    //     urls = [...urls, ...(await page.evaluate(() => {
    //       const results = Array.from(document.querySelectorAll("li[id^='result_']"))
    //       .filter(result => {
    //         return result.querySelectorAll('a')[1].href.split('/').includes('www.amazon.com') == true
    //       })
    //       return [].map.call(results, a => a.querySelectorAll('a')[1].href);
    //     }))].slice(0, input.count)
    //
    //   console.log(`Adding Dataset... ${urls.length} loaded`);
    //
    //   await page.click('#pagnNextString');
    //   await page.waitForSelector('div#resultsCol');
    //   await page.waitFor(10000);
    // }
    //
    // let products = []
    // for (let i = 0; i < urls.length; i++) {
    //   console.log(`Request ${urls[i]} `);
    //   let url = urls[i];
    //   await page.goto(`${url}`, {timeout: 3000000});
    //   await page.waitForSelector('#productTitle');
    //   products.push(await page.evaluate(() => {
    //     if (document.querySelector('#priceblock_ourprice')){
    //       return {
    //         url: url,
    //         title: document.querySelector('#productTitle').textContent.trim(),
    //         price: document.querySelector('#priceblock_ourprice').textContent.trim(),
    //         availability: document.querySelector('#availability').textContent.trim()
    //       }
    //     }
    //   }))
    // }
    //
    // for(const product of products){
    //   console.log(`Adding Dataset ${JSON.stringify(product)}`);
    //   const dataset = await Apify.openDataset('amazon-products');
    //   await dataset.pushData([product])
    // }
    //
    await browser.close();
});
