(function (App, $) {
  App.ui = App.ui || {};
  App.ui.modal = App.ui.modal || {};

  const getModal = (target) => {
    if (!target) return $();
    if (target instanceof $) return target.closest('.modalLayout').length ? target.closest('.modalLayout') : target;
    const $byId = $(`#${target}`);
    if ($byId.length) return $byId.hasClass('modalLayout') ? $byId : $byId.closest('.modalLayout');
    return $(target).closest('.modalLayout');
  };

  App.ui.modal.show = function (target) {
    const $modal = getModal(target);
    if (!$modal.length) return;
    $modal.addClass('active');
    $('body').addClass('modalOpen');
  };

  App.ui.modal.close = function (target) {
    const $modal = target ? getModal(target) : $('.modalLayout.active');
    $modal.removeClass('active');
    if ($('.modalLayout.active').length === 0) {
      $('body').removeClass('modalOpen');
    }
  };

  App.ui.modal.init = function (scope) {
    const $scope = scope ? $(scope) : $(document);

    $scope.on('click.modal', '.modalLayout .close, .modalLayout .done:not(.updateDone), .modalLayout .modalBg', function (e) {
      e.stopPropagation();
      App.ui.modal.close($(this));
    });

    $scope.on('keydown.modal', function (e) {
      if (e.key !== 'Escape') return;
      const $active = $('.modalLayout.active').last();
      if ($active.length) {
        e.preventDefault();
        App.ui.modal.close($active);
      }
    });
  };

  window.modalShow = function (modalId) {
    App.ui.modal.show(modalId);
  };

  window.modalClose = function (modalId) {
    App.ui.modal.close(modalId);
  };

  $(function () {
    App.ui.modal.init(document);
  });
})(window.App = window.App || {}, jQuery);
