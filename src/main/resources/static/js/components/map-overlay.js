(function (App, $) {
  App.ui = App.ui || {};
  App.ui.mapOverlay = App.ui.mapOverlay || {};

  App.ui.mapOverlay.init = function () {
    const $wrap = $('[data-map-floating-wrap]');
    if (!$wrap.length || $wrap.data('mapFloatingBound')) return;

    $wrap.data('mapFloatingBound', true);

    $wrap.on('click', '[data-map-filter-btn]', function () {
      $(this).addClass('active').siblings('[data-map-filter-btn]').removeClass('active');
    });

    $wrap.on('click', '#mapResearchBtn', function () {
      if (typeof callRequestMapApi === 'function') callRequestMapApi();
    });

    $wrap.on('click', '[data-map-tool]', function () {
      const $btn = $(this);
      const tool = $btn.attr('data-map-tool');
      const $group = $btn.closest('.mapToolGroup');

      if (tool === 'distance' || tool === 'area' || tool === 'radius') {
        const isActive = $btn.toggleClass('active').hasClass('active');
        $group.find('[data-map-tool]').not($btn).removeClass('active');
        if (!isActive) return;
        return;
      }

      $btn.toggleClass('active');
    });

    $wrap.on('click', '[data-map-zoom-in]', function () {
      const map = window.Zinidata?.map?.map;
      if (map) map.setZoom(map.getZoom() + 1);
    });

    $wrap.on('click', '[data-map-zoom-out]', function () {
      const map = window.Zinidata?.map?.map;
      if (map) map.setZoom(map.getZoom() - 1);
    });

    $wrap.on('click', '[data-map-locate]', function () {
      if (!window.Zinidata?.auth?.gps) return;

      Zinidata.auth.gps.getCurrentPosition(
        (centerX, centerY) => {
          if (typeof mapMove === 'function') mapMove(centerX, centerY, Zinidata.map.map.getZoom());
        },
        () => {
          const coords = Zinidata.auth.gps.getCurrentCoordinates();
          if (coords && typeof mapMove === 'function') {
            mapMove(coords.centerX, coords.centerY, Zinidata.map.map.getZoom());
          }
        }
      );
    });
  };

  $(function () {
    App.ui.mapOverlay.init();
  });
})(window.App = window.App || {}, jQuery);
