
# Auto Web-Scraping with APIfy Actors
See docs at https://www.apify.com/docs

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
