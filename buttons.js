function hideAboutpanel() {
    document.getElementById("about").style.display = "none";
}

function openAboutpanel() {
    document.getElementById("about").style.display = "block";
}

function openHamburger() {
    document.getElementById("hamburgermenu").style.display = "block";
}

function closeHamburger() {
    document.getElementById("hamburgermenu").style.display = "none";
}

function showInfopanel() {
    if ($(".info").hasClass('hide')) {
      if ($(window).width() > 960) {
        $(".info").animate({
          left: "+=33%"
        }, 200, function () {
          // Animation complete.
        });
        $(".mapcontainer").animate({
          left: "33%"
        }, 200, function () {
          // Animation complete.
        });
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
        $(".info").animate({
          left: "-=33%"
        }, 200, function () {
          // Animation complete.
        });
        $(".mapcontainer").animate({
          left: "0px"
        }, 200, function () {
          // Animation complete.
        });
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