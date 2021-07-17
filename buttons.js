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

function toggleBiginfopanel() {

  if ($(".article-image").hasClass('hide')) {
    if ($(window).width() > 960) {
      infoTwothirds();
      mapOnethird();
    }
    $(".article-image").removeClass('hide').addClass('show');
  }
  else {
    if ($(window).width() > 960) {
      infoOnethird();
      mapTwothirds();
    }
    $(".article-image").removeClass('show').addClass('hide');
  }
  
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
  $(".article-image").animate({
    'min-height': "300px",
  }, 200, function () {
    // Animation complete.
  });
  document.getElementById("wiki-intro").style.width = "100%";
  document.getElementById("wikilinks").style.width = "100%";
  document.getElementById("article-links").style.flexDirection = "column";
}

function infoTwothirds() {
    $(".info").animate({
      left: "0px",
    width: "66%"
    }, 200, function () {
      // Animation complete.
    });
    $(".article-image").animate({
      'min-height': "500px",
    }, 200, function () {
      // Animation complete.
    });
    document.getElementById("wiki-intro").style.width = "50%";
    document.getElementById("wikilinks").style.width = "50%";
    document.getElementById("article-links").style.flexDirection = "row";

}