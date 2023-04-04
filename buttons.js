function showInfopanel() {
    if ($(window).width() > 900) {
        infoOnethird();
    }
    if ($(window).width() < 900 && $(window).width() > 600) {
        infoFullscreen();
    }
    if ($(window).width() < 600) {
        infoFullscreen();
    }
}

function hideInfopanel() {
    infoHidden();
}

function infoHidden() {
    $(".info").animate({
        width: "0%",
    }, 200, function() {
        // Animation complete.
        $(".info").hide();
        map.resize()
        $(".enlargeMapIcon").hide()
    });
    // $(".info").hide();
}

function infoOnethird() {
    $(".info").show();
    $(".info").animate({
        left: "0px",
        width: "38%"
    }, 200, function() {
        // Animation complete.
        $(".enlargeMapIcon").show()
    });
}

function infoFullscreen() {
    $(".info").show();
    $(".info").animate({
        left: "0px",
        width: "100%"
    }, 200, function() {
        // Animation complete.
        $(".enlargeMapIcon").hide()
    });
}


const closeButton = document.querySelector(".info-close");

closeButton.addEventListener("click", () => {
    hideInfopanel()
});
