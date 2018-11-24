
// startURL: https://condos.ca/search?for=rent&search_by=Neighbourhood&rent_min=750&rent_max=99999999&unit_area_min=0&unit_area_max=99999999&beds_min=0&area_ids=1&view=0&user_search=1&sort=days_on_market
// pseudoURL: https://condos.ca/search?for=rent&search_by=Neighbourhood&rent_min=750&rent_max=99999999&unit_area_min=0&unit_area_max=99999999&[.*]
// clickableElements: a#listing-next


function pageFunction(context) {
    // called on every page the crawler visits, use it to extract data from it
    var $ = context.jQuery;
    var results = [];
    $("div#listing-tab > div.row > a").each( function(i, ahref) {
        console.log("---------- FEED ITEM -----------")
        console.log(i)
        var scraped_obj = {
            address : $(this).find("span.listing-name").text().trim(),
            ad_url : ahref.href,
        }
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
