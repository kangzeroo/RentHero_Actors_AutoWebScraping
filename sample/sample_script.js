
function pageFunction(context) {
    // called on every page the crawler visits, use it to extract data from it
    var $ = context.jQuery;
    // import momentjs and wait for it to finish loading after 1 second
    // var mt = document.createElement('script');
    // mt.src = "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.js";
    // document.getElementsByTagName('head')[0].appendChild(mt);

    var MOMENT_JS = 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.js'
    $.when(
        $.getScript(MOMENT_JS),
        // put more libraries here
        $.Deferred(function( deferred ){
            $( deferred.resolve );
        })
    ).done(function(){
        //place your code here, the scripts are all loaded
        extractData();
    });

    // the actual script called after async loading success
    var extractData = function() {
      var compiled_object = {
        address: '',
        neighborhood: '',
        unit_num: '',
        price: '',
        beds: 0,
        baths: 0,
        sqft: '',
        posted_on: '',
        description: '',
        walkscore: 0,
        mls_id: '',
        amenities: [],
        seller_name: '',
        seller_phone: '',
        seller_email: '',
        // compiled_object.multi_units is a list of objects with the exact same compiled object schema
        // used b/c zumper ads are building-level, not unit-level.
        // thus some zumper ads have multiple units, so we want crawler to account for that
        multi_units: [],
        images: []
      }

      // checks if the listing is for multi-units or single unit
      var floorplans = document.querySelectorAll(".building-floorplans")
      if (floorplans.length > 0) {
        // grab the main info
        compiled_object.address = document.querySelectorAll(".address")[0] ? document.querySelectorAll(".address")[0].textContent.trim() : ''
        compiled_object.neighborhood = document.querySelectorAll(".neighborhood")[0] ? document.querySelectorAll(".neighborhood")[0].textContent.trim() : ''
        compiled_object.description = document.querySelectorAll(".description")[0] ? document.querySelectorAll(".description")[0].textContent.trim() : ''
        compiled_object.walkscore = document.querySelectorAll(".walkscore > .score")[0] ? document.querySelectorAll(".walkscore > .score")[0].textContent.trim() : ''

        // grab the contact details
        compiled_object.seller_name = document.querySelectorAll(".brokerage")[0] ? document.querySelectorAll(".brokerage")[0].textContent.trim() : ''
        $(".phone-number").click()
        compiled_object.seller_phone = document.querySelectorAll(".phone-number + a")[0] ? document.querySelectorAll(".phone-number + a")[0].textContent.trim() : ''

        // open all the units
        $(".floorplan-panel").each(function(i, u){
          console.log(u)
          u.click()
        })
        // opens all the units amenities
        $(".amenity-toggle.more").each(function(i, ua){
          console.log(ua)
          ua.click()
        })

        var all_units = []
        $('.floorplan-content.in').each(function(i, ud){
          console.log('-------- UNIT ---------')
          console.log(i)
          console.log(ud)
          var unit = {
            beds: $(this).find("span.floorplan-title").text().trim(),
            baths: $(this).find(".spec.bath").text().trim(),
            sqft: $(this).find(".spec.sqft > .label.sqft").text().trim(),
            price: $(this).find(".rent-per-month > .price").text().trim()
          }
          console.log(unit)
          all_units.push(unit)
        })
        compiled_object.multi_units = all_units
      } else {
        // checks if the listing has a detailed address or not
        // with and without obfuscated css classname
        var ad_age = ''
        if (document.querySelectorAll(".address").length > 0) {
          compiled_object.address = document.querySelectorAll(".address")[0] ? document.querySelectorAll(".address")[0].textContent : ''
          compiled_object.neighborhood = document.querySelectorAll(".neighborhood")[0] ? document.querySelectorAll(".neighborhood")[0].textContent : ''
          compiled_object.price = document.querySelectorAll(".price-container > div > span")[0] ? document.querySelectorAll(".price-container > div > span")[0].textContent : ''
          compiled_object.beds = document.querySelectorAll(".amenities > .row > .details-meta-col > span")[0] ? document.querySelectorAll(".amenities > .row > .details-meta-col > span")[0].textContent : ''
          compiled_object.baths = document.querySelectorAll(".amenities > .row > .details-meta-col > span")[1] ? document.querySelectorAll(".amenities > .row > .details-meta-col > span")[1].textContent : ''
          compiled_object.sqft = document.querySelectorAll(".amenities > .row > .details-meta-col > span")[2] ? document.querySelectorAll(".amenities > .row > .details-meta-col > span")[2].textContent : ''
          ad_age = document.querySelectorAll(".amenities > .row > .details-meta-col > span")[4].textContent
          compiled_object.description = document.querySelectorAll(".description")[0] ? document.querySelectorAll(".description")[0].textContent : ''
          compiled_object.walkscore = document.querySelectorAll(".walkscore > .score")[0] ? document.querySelectorAll(".walkscore > .score")[0].textContent : ''
          compiled_object.seller_name = document.querySelectorAll(".agent-full-name")[0] ? document.querySelectorAll(".agent-full-name")[0].textContent.trim() : ''
          $(".phone-number").click()
          compiled_object.seller_phone = document.querySelectorAll(".phone-number + a")[0] ? document.querySelectorAll(".phone-number + a")[0].textContent.trim() : ''
        } else {
          // note that for some reason theses zumper pages without much detail have obfuscate css classnames (possibly to prevent web scraping)
          // the obfuscate css classnames may change every few days, which means you will have to find the new obfuscate css classnames
          compiled_object.address = document.querySelectorAll("._1ga9O")[0] ? document.querySelectorAll("._1ga9O")[0].textContent : ''
          compiled_object.neighborhood = document.querySelectorAll("._3oBUZ")[0] ? document.querySelectorAll("._3oBUZ")[0].textContent.replace('Rent Trends', '').trim() : ''
          compiled_object.price = document.querySelectorAll("._2S5Wh > div:first-child")[0].textContent
          compiled_object.beds = document.querySelectorAll("._3DRtr > div > .zi7KE")[0] ? document.querySelectorAll("._3DRtr > div > .zi7KE")[0].textContent : ''
          compiled_object.baths = document.querySelectorAll("._3DRtr > div > .zi7KE")[1] ? document.querySelectorAll("._3DRtr > div > .zi7KE")[1].textContent : ''
          compiled_object.sqft = document.querySelectorAll("._3DRtr > div > .zi7KE")[2] ? document.querySelectorAll("._3DRtr > div > .zi7KE")[2].textContent : ''
          ad_age = document.querySelectorAll("._3DRtr > div > .zi7KE")[4] ? document.querySelectorAll("._3DRtr > div > .zi7KE")[4].textContent : ''
          compiled_object.description = document.querySelectorAll(".XMfnx")[0] ? document.querySelectorAll(".XMfnx")[0].textContent : ''
          compiled_object.walkscore = document.querySelectorAll(".walkscore > .score")[0] ? document.querySelectorAll(".walkscore > .score")[0].textContent : ''
          compiled_object.seller_name = document.querySelectorAll(".Xtx8A")[0] ? document.querySelectorAll(".Xtx8A")[0].textContent : ''
          compiled_object.seller_phone = document.querySelectorAll(".Xtx8A._3M2Sh > a")[0] ? document.querySelectorAll(".Xtx8A._3M2Sh > a")[0].textContent : ''
        }

        // determining ad posted date
        var number_found = ad_age.match(/\d+/g)
        if (ad_age.toLowerCase().indexOf('day') > -1 && number_found && parseInt(number_found)) {
          var days_old_int = parseInt(number_found)
          compiled_object.posted_on = moment().subtract(days_old_int, "days").toISOString()
        }
        if (ad_age.toLowerCase().indexOf('hour') > -1 && number_found && parseInt(number_found)) {
          var hours_old_int = parseInt(number_found)
          compiled_object.posted_on = moment().subtract(hours_old_int, "hours").toISOString()
        }
      }

      // unit and building amenities
      // normal css and obfuscated css
      if (document.querySelectorAll(".details-amenities").length > 0) {
        var amenities_list = []
        $(".details-amenities > .module-details > .amenity > span").each(function(i, ah){
          console.log(i)
          amenities_list.push(ah.textContent.trim())
        })
        compiled_object.amenities = amenities_list
      }
      // obfuscated css
      if (document.querySelectorAll("._2FgsT").length > 0) {
        var amenities_list = []
        $("._2FgsT > .Abi6K > .Fq4FI > span").each(function(i, ah){
          console.log(i)
          amenities_list.push(ah.textContent.trim())
        })
        compiled_object.amenities = amenities_list
      }


      // grab the images
      var imgs = []
      var count = 0
      $('.main-image, ._35-HT').click()
      setTimeout(function() {
        // we need to click through thumbnails to load them
        var intv = setInterval(function(){
          // $('._3nebV, .carousel-control.right').click()
          // console.log('Found thumbnails x', $('._3nebV, .carousel-control.right').length)
          $('._1Ye7D, .thumbnail, ._2RoUH')[count].click()
          console.log('Clicking through thumbnail #', count)
          count++
          console.log('Image counter going up to -- ', count)
          if (count >= $('._1Ye7D, .thumbnail, ._2RoUH').length) {
            clearInterval(intv)
          }
        }, 150)
        setTimeout(function() {
          $(".landscape").each(function(i, img){
            var bck_img = $(this)[0].style.backgroundImage
            var img_url = bck_img.slice('url("'.length - 1, bck_img.length - 1).replace('"', '')
            imgs.push(img_url)
          })

          $("img").each(function(i, img){
            var img_url = img.src
            if (img_url.indexOf('small') > -1) {
              imgs.push(img_url.replace('small', '1280x960'))
            }
            if (img_url.indexOf('1280x960') > -1) {
              imgs.push(img_url)
            }
          })

          var no_dupe_imgs = []
          imgs.forEach(function(im){
            var exists = false
            no_dupe_imgs.forEach(function(nd){
              if (nd === im) {
                exists = true
              }
            })
            if (!exists) {
              no_dupe_imgs.push(im)
            }
          })
          compiled_object.images = no_dupe_imgs
          console.log(compiled_object.images)
          context.finish(compiled_object)
        }, 5000)
      }, 500)
    }

    // wait for everything to finish after context.finish()
    context.willFinishLater();
}
