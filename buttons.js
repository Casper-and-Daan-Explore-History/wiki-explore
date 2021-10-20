function hideAboutpanel() {
    document.getElementById("about").style.display = "none";
}

function openAboutpanel() {
    document.getElementById("about").style.display = "block";
}


function showInfopanel() {
  if ($(".info").hasClass('hide')) {
    if ($(window).width() > 960) {
      infoOnethird();
      mapTwothirds();
      $(".info").removeClass('hide').addClass('show');
    }
    if ($(window).width() < 960 && $(window).width() > 480) {
      $(".info").animate({
        left: "+=70vw"
      }, 200, function () {
        // Animation complete.
      });
      $(".info").removeClass('hide').addClass('show');
    }
    if ($(window).width() < 480) {
      $(".info").animate({
        left: "+=100vw"
      }, 200, function () {
        // Animation complete.
      });

      $(".info").removeClass('hide').addClass('show');
    }
  }
}
  
function hideInfopanel() {
  if ($(".info").hasClass('show')) {
    if ($(window).width() > 960) {
      infoHidden();
      mapFullscreen();
      $(".info").removeClass('show').addClass('hide');
    }
    if ($(window).width() < 960 && $(window).width() > 480) {
      $(".info").animate({
        left: "-=70vw"
      }, 200, function () {
        // Animation complete.
      });
      $(".info").removeClass('show').addClass('hide');
    }
    if ($(window).width() < 480) {
      $(".info").animate({
        left: "-=100vw"
      }, 200, function () {
        // Animation complete.
      });
      $(".info").removeClass('show').addClass('hide');
    }
  }
}

function toggleBigimage() {
  if ($(".article-image").hasClass('hide')) {
    if ($(window).width() > 960) {
      infoTwothirds();
      mapOnethird();
      hideText();
      hideLinks();
      imageInFocus();
    }
    $(".article-image").removeClass('hide').addClass('show');
  }
  else {
    if ($(window).width() > 960) {
      infoOnethird();
      mapTwothirds();
      showEverything()
      imageOutFocus();
      
    }
    $(".article-image").removeClass('show').addClass('hide');
  }
}

function toggleBigtext() {
  if ($(".wiki-intro").hasClass('hide')) {
    if ($(window).width() > 960) {
      infoTwothirds();
      mapOnethird();
      hideImage();
      hideLinks();
      textInFocus();
        
    }
    $(".wiki-intro").removeClass('hide').addClass('show');
  }
  else {
    if ($(window).width() > 960) {
      infoOnethird();
      mapTwothirds();
      showEverything();
      textOutFocus();
    }
    $(".wiki-intro").removeClass('show').addClass('hide');
  }
}


function hideImage() {
  //hide the image
  document.getElementById("articleimage").style.display = "none";
}

function hideText() {
  //hide the text
  document.getElementById("wiki-intro").style.display = "none";
}

function hideLinks() {
  //hide the links
  document.getElementById("wikilinks").style.display = "none";
}

function showEverything() {
  //show everything again
  document.getElementById("wikilinks").style.display = "flex";
  document.getElementById("wiki-intro").style.display = "block";
  document.getElementById("articleimage").style.display = "block";
}


function textInFocus() {
  $(".wiki-intro").animate({
    'marginLeft': "16px"
  }, 200, function () {
    // Animation complete.
  });    
  document.getElementById("readmore").style.display = "none";
  document.getElementById("closeicon").style.display = "block";
  document.getElementById("wiki-intro").style.padding = "5rem";
  document.getElementById("wiki-intro").style.maxHeight = "none";
  document.getElementById("wiki-intro").style.overflow = "visible";
  document.getElementById("wiki-intro-content-text").style.maxHeight = "none";


}

function textOutFocus() {
  $(".wiki-intro").animate({
    'marginLeft': "0px"
  }, 200, function () {
    // Animation complete.
  });   
  document.getElementById("readmore").style.display = "block";
  document.getElementById("closeicon").style.display = "none";
  document.getElementById("wiki-intro").style.padding = "1rem";
  document.getElementById("wiki-intro").style.maxHeight = "300px";
  document.getElementById("wiki-intro").style.overflow = "hidden";
  document.getElementById("wiki-intro-content-text").style.maxHeight = "300px";
}


function imageInFocus() {
  $(".article-image").animate({
        'min-height': "500px",
      }, 200, function () {
        // Animation complete.
  });
  document.getElementById("article-image").style.objectFit = "contain";
}

function imageOutFocus() {
  $(".article-image").animate({
    'min-height': "300px",
  }, 200, function () {
    // Animation complete.
  });
  document.getElementById("article-image").style.objectFit = "cover";
}


function mapFullscreen() {
  $(".mapcontainer").animate({
    left: "16px"
  }, 200, function () {
    // Animation complete.
  });
}

function mapTwothirds() {
  $(".mapcontainer").animate({
    left: "33%"
  }, 200, function () {
    // Animation complete.
  });
}

function mapOnethird() {
  $(".mapcontainer").animate({
    left: "66%"
  }, 200, function () {
    // Animation complete.
  });
}

function infoHidden() {
  $(".info").animate({
    left: "-=33%"
  }, 200, function () {
    // Animation complete.
  });
}

function infoOnethird() {
  $(".info").animate({
    left: "0px",
    width: "33%"
  }, 200, function () {
    // Animation complete.
  });
}

function infoTwothirds() {
    $(".info").animate({
      left: "0px",
    width: "66%"
    }, 200, function () {
      // Animation complete.
    });
    

}