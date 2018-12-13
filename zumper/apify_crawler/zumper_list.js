// var jsonLD = $$('script[type="application/ld+json"]');
// jsonLD[30].innerText = {
//   "@context": "http://schema.org",
//   "@type": "Apartment",
//   "address": {
//     "@context": "http://schema.org",
//     "@type": "PostalAddress",
//     "addressLocality": "Toronto",
//     "addressRegion": "ON",
//     "name": "Yonge & St. Clair #32158",
//     "postalCode": "M4V 2Z3",
//     "streetAddress": "Yonge & St. Clair #32158"
//   },
//   "name": "Apartments for Rent at Yonge & St. Clair #32158",
//   "geo": {
//     "@type": "GeoCoordinates",
//     "latitude": 43.6797776059281,
//     "longitude": -79.3992441074001
//   },
//   "url": "https://www.zumper.com/apartments-for-rent/34111682/2-bedroom-south-hill-toronto-on",
//   "photo": "https://d37lj287rvypnj.cloudfront.net/259053161/medium",
//   "containedInPlace": {
//     "@context": "http://schema.org",
//     "@type": "City",
//     "address": {
//       "@context": "http://schema.org",
//       "@type": "PostalAddress",
//       "addressLocality": "Toronto",
//       "addressRegion": "ON"
//     },
//     "name": "Toronto",
//     "url": "https://www.zumper.com/apartments-for-rent/toronto-on"
//   }
// }





function pageFunction(context) {
    // called on every page the crawler visits, use it to extract data from it
    var $ = context.jQuery;
    var results = [];
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
