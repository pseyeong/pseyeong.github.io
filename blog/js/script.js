(function ($) {
  "use strict";

  var HEADER_OFFSET = 80;
  var SCROLL_DURATION = 500;
  var sectionIds = ["home", "css", "js", "react"];

  function getScrollTop() {
    return $(window).scrollTop();
  }

  function scrollToSection(id) {
    var $target = $("#" + id);
    if (!$target.length) return;

    $("html, body").animate(
      {
        scrollTop: $target.offset().top - HEADER_OFFSET,
      },
      SCROLL_DURATION
    );
  }

  function setActiveSection(id) {
    $(".site-nav-link, .site-mobile-nav-link").removeClass(
      "site-nav-link--active site-mobile-nav-link--active"
    );

    $('.site-nav-link[data-section="' + id + '"]').addClass(
      "site-nav-link--active"
    );
    $('.site-mobile-nav-link[data-section="' + id + '"]').addClass(
      "site-mobile-nav-link--active"
    );
  }

  function getCurrentSection() {
    var scrollTop = getScrollTop() + HEADER_OFFSET + 20;
    var current = sectionIds[0];

    $.each(sectionIds, function (_, id) {
      var $section = $("#" + id);
      if ($section.length && $section.offset().top <= scrollTop) {
        current = id;
      }
    });

    return current;
  }

  function onScroll() {
    setActiveSection(getCurrentSection());
  }

  function bindNavClick(selector) {
    $(selector).on("click", function (e) {
      e.preventDefault();
      var id = $(this).data("section");
      if (!id) return;

      scrollToSection(id);
      setActiveSection(id);

      if (history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }
    });
  }

  $(function () {
    bindNavClick(".site-nav-link");
    bindNavClick(".site-mobile-nav-link");
    bindNavClick(".site-logo");

    var scrollTicking = false;
    $(window).on("scroll", function () {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        scrollTicking = false;
      });
    });

    var hash = window.location.hash.replace("#", "");
    if (hash && sectionIds.indexOf(hash) !== -1) {
      setTimeout(function () {
        scrollToSection(hash);
        setActiveSection(hash);
      }, 100);
    } else {
      onScroll();
    }
  });
})(jQuery);
