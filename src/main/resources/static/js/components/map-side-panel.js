(function (App, $) {
  App.ui = App.ui || {};
  App.ui.mapSidePanel = App.ui.mapSidePanel || {};

  App.ui.mapSidePanel.init = function () {
    const $wrap = $('[data-map-side-panel-wrap]');
    if (!$wrap.length || $wrap.data('mapSidePanelBound')) return;

    $wrap.data('mapSidePanelBound', true);

    $wrap.on('click', '[data-map-side-panel-toggle]', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isCollapsed = $wrap.toggleClass('is-collapsed').hasClass('is-collapsed');
      const $btn = $(this);

      $btn.attr('aria-expanded', !isCollapsed);
      $btn.attr('aria-label', isCollapsed ? '검색 결과 패널 펼치기' : '검색 결과 패널 접기');
    });
  };

  $(function () {
    App.ui.mapSidePanel.init();
  });
})(window.App = window.App || {}, jQuery);
