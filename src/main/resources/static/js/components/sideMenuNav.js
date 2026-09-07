(function (App, $) {
  App.ui = App.ui || {};
  App.ui.sideMenuNav = App.ui.sideMenuNav || {};

  const getOffsetInScrollRoot = ($el, $scrollRoot) => {
    const el = $el[0];
    const rootEl = $scrollRoot[0];
    if (!el || !rootEl) return 0;

    return el.getBoundingClientRect().top - rootEl.getBoundingClientRect().top + $scrollRoot.scrollTop();
  };

  App.ui.sideMenuNav.init = function (scope) {
    const $scope = scope ? $(scope) : $(document);

    $scope.find('[data-side-menu-nav]').each(function () {
      const $wrap = $(this);
      if ($wrap.data('sideMenuNavBound')) return;

      const $scrollRoot = $wrap.find('.reportContPageBody').first();
      const $list = $wrap.find('.sideMenuNavList').first();
      const $sections = $scrollRoot.find('[data-report-section]');

      if (!$scrollRoot.length || !$list.length || !$sections.length) return;

      $wrap.data('sideMenuNavBound', true);

      let sectionOffsets = [];
      let lastActiveIdx = -1;
      let isProgrammaticScroll = false;
      let scrollEndTimer = null;

      const cacheOffsets = () => {
        sectionOffsets = $sections
          .map(function () {
            return getOffsetInScrollRoot($(this), $scrollRoot);
          })
          .get();
      };

      $list.empty();

      $sections.each(function (index) {
        const $section = $(this);
        const sectionId = $section.attr('id') || `report-cont-section-${index + 1}`;
        $section.attr('id', sectionId);
        $section.attr('data-section-index', index);

        const label =
          $.trim($section.find('.reportContSectionTitle').first().text()) || `섹션 ${index + 1}`;

        $list.append(
          $('<li class="sideMenuNavItem"></li>').append(
            $('<button type="button" class="sideMenuNavItemBtn"></button>')
              .text(label)
              .attr('data-section-index', index)
              .attr('aria-current', 'false')
          )
        );
      });

      const $menuItems = $list.find('.sideMenuNavItem');

      const scrollActiveMenuIntoView = (index) => {
        if (!window.matchMedia('(max-width: 1023px)').matches) return;
        const item = $menuItems.eq(index)[0];
        if (!item || !$list[0]) return;

        const listEl = $list[0];
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;
        const listWidth = listEl.clientWidth;
        const curScroll = listEl.scrollLeft;

        if (itemLeft < curScroll) {
          listEl.scrollLeft = itemLeft;
        } else if (itemLeft + itemWidth > curScroll + listWidth) {
          listEl.scrollLeft = itemLeft + itemWidth - listWidth;
        }
      };

      const applyActive = (index, scrollMenu = false) => {
        if (index < 0 || index >= $menuItems.length || index === lastActiveIdx) return;

        lastActiveIdx = index;
        $menuItems.removeClass('active');
        $menuItems.eq(index).addClass('active');
        $menuItems.find('.sideMenuNavItemBtn').attr('aria-current', 'false');
        $menuItems.eq(index).find('.sideMenuNavItemBtn').attr('aria-current', 'true');

        if (scrollMenu) scrollActiveMenuIntoView(index);
      };

      const getActiveIndex = () => {
        const scrollTop = $scrollRoot.scrollTop();
        const maxScroll = $scrollRoot[0].scrollHeight - $scrollRoot[0].clientHeight;

        if (scrollTop >= maxScroll - 10) {
          return $sections.length - 1;
        }

        let activeIdx = 0;
        sectionOffsets.forEach((offset, i) => {
          if (scrollTop >= offset - 1) activeIdx = i;
        });

        return activeIdx;
      };

      const scheduleActiveUpdate = () => {
        if (isProgrammaticScroll) return;

        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => {
          applyActive(getActiveIndex(), false);
        }, 80);
      };

      const scrollToSection = (index) => {
        const maxScroll = Math.max(0, $scrollRoot[0].scrollHeight - $scrollRoot[0].clientHeight);
        const targetScroll = Math.min(Math.max(0, sectionOffsets[index] || 0), maxScroll);

        isProgrammaticScroll = true;
        applyActive(index, true);

        $scrollRoot.stop(true).animate({ scrollTop: targetScroll }, 300, () => {
          isProgrammaticScroll = false;
          applyActive(index, true);
        });
      };

      $list.on('click.sideMenuNav', '.sideMenuNavItemBtn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        scrollToSection(Number($(this).attr('data-section-index')));
      });

      $scrollRoot.on('scroll.sideMenuNav', scheduleActiveUpdate);

      const scrollRootEl = $scrollRoot[0];
      if (scrollRootEl && 'onscrollend' in scrollRootEl) {
        scrollRootEl.addEventListener(
          'scrollend',
          () => {
            if (isProgrammaticScroll) return;
            clearTimeout(scrollEndTimer);
            applyActive(getActiveIndex(), false);
          },
          { passive: true }
        );
      }

      cacheOffsets();
      applyActive(getActiveIndex(), false);

      $(window).on('resize.sideMenuNav', () => {
        cacheOffsets();
        lastActiveIdx = -1;
        applyActive(getActiveIndex(), false);
      });
    });
  };

  $(function () {
    App.ui.sideMenuNav.init(document);
  });
})(window.App = window.App || {}, jQuery);
