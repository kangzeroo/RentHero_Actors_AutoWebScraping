
# Auto Web-Scraping with APIfy Actors
You must run in node v8.4.0! See docs at https://www.apify.com/docs

## To Do
- Grab images from kijiji ad
- Grab the posters' name from kijiji ad
- Login to Kijiji so we can grab the contact phone # on ads
- Catch extracted data in API Gateway and parse into clean data (with notes on expected incoming data structure)
- save a copy of the kijiji ads' images and backup into S3 bucket (optional)
- Setup dev and prod dynamodb tables for scraped listings
- Fix the APIfy CLI deployment process. Build fails when deployed from CLI
- Figure out how to set development/production environments for APIfy Actors
- Schedule APIfy Crawler for Kijiji Listings to run daily

## Documentation
- Puppeteer: https://pptr.dev/#?product=Puppeteer&version=v1.10.0&show=api-elementhandleclickoptions
- APIfy Client: https://sdk.apify.com/docs/api/puppeteercrawler#docsNav

### Common Scraping Syntaxes
- jQuery: `$('.athing:eq(0) .title:eq(1)').text()` --> https://www.w3schools.com/jquery/jquery_ref_selectors.asp <br/>
- CSS Selectors `document.querySelectorAll(".athing:nth-of-type(1) .title")[1].textContent` <br/>
- XPATH `document.evaluate('//tr[@class="athing"][1]/td[@class="title"][2]', document, null, XPathResult.STRING_TYPE, null).stringValue` <br/>

### Importing Libraries into Chrome Console
```
// import jQuery
var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);

// import MomentJS
var mt = document.createElement('script');
mt.src = "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.js";
document.getElementsByTagName('head')[0].appendChild(mt);
```

## How To Run
