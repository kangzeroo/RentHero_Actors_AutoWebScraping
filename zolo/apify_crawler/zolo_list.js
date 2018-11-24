
// startURL: https://www.zolo.ca/index.php?attribute_terms=&has_photos=0&days_on_zolo=0&ptype_condo=0&ptype_townhouse=0&ptype_house=0&stype=&min_price=0&max_price=0&min_beds=0&min_baths=0&min_sqft=0&openhouse_search=0&filter=1&sarea=Toronto&s_r=2&search_order=3
// pseudoURL: https://www.zolo.ca/index.php?sarea=Toronto&s_r=2&s=[\d+]
// clickableElements: "a > i.icon-keyboard-arrow-right" 

function pageFunction(context) {
    // called on every page the crawler visits, use it to extract data from it
    var $ = context.jQuery;
    var results = [];
    $("a[itemprop='address']").each( function(i) {
        console.log("---------- FEED ITEM -----------")
        console.log(i)
        var scraped_obj = {
            address : $(this).find("span[itemprop='streetAddress']").text() + ' ' + $(this).find("span[itemprop='addressLocality']").text() + ' ' + $(this).find("span[itemprop='addressRegion']").text(),
            ad_url : $(this).attr('href')
        }
        console.log(scraped_obj.address)
        results.push(scraped_obj);
    });

    var final_results = []
    results.forEach((function(r) {
      var exists = false
      final_results.forEach((function(f) {
        if (f.ad_url === r.ad_url) {
          exists = true
        }
      }))
      if (!exists) {
        final_results.push(r)
      }
    }))
    return final_results;
}
