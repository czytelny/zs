// Default JavaScript Functions and Initiations
$(document).ready(function() {

    $('#mobile-menu-open').click(function() {
        $("#mobile-menu").toggle("slide", {direction: 'right'});
    });

    $('.logo-mobile').click(function() {
        $("html, body").animate({scrollTop: 0}, "slow");
    });

    $(function() {
        var navStatesInPixelHeight = [40, 65];

        var changeNavState = function(nav, newStateIndex) {
            nav.data('state', newStateIndex).stop().animate({
                height: navStatesInPixelHeight[newStateIndex] + 'px'
            }, 600);
        };

        var boolToStateIndex = function(bool) {
            return bool * 1;
        };

        var maybeChangeNavState = function(nav, condState) {
            var navState = nav.data('state');
            if (navState === condState) {
                changeNavState(nav, boolToStateIndex(!navState));
            }
        };

        $('header').data('state', 1);

        $(window).scroll(function() {
            var $nav = $('header');

            if ($(document).scrollTop() > 0 && $(window).width() < 720) {
                maybeChangeNavState($nav, 1);
                $('#mobile-phone-number').hide();
                $('.logo-mobile-letter').hide();
            } else {
                maybeChangeNavState($nav, 0);
                $('#mobile-phone-number').show('fast');
                $('.logo-mobile-letter').show('fast');
            }
        });
    });
}); // end document ready

$(document).on('click', '.news-tile', function() {
    var e = $(this).find('.b-content');
    if (e.is(":visible")){
        $(this).find('.b-content').fadeOut();
    } else {
        $(this).find('.b-content').fadeIn();
    }
});
