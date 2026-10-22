/**
 * 화면 상태 전환용 UI 스크립트 (기능/API 연동 전 목업)
 * - PC: 사이드 탭 (자리 상세 / 회전문 랭킹)
 * - MO: 랭킹 시트 ↔ 상세 시트 ↔ 검색 오버레이
 */
(() => {
  const app = document.documentElement;

  const setSheet = (mode) => {
    app.dataset.sheet = mode;
  };

  const setSearch = (open) => {
    app.dataset.search = open ? 'open' : 'closed';
  };

  document.addEventListener('DOMContentLoaded', () => {
    setSheet('ranking');
    setSearch(false);

    const activatePcTab = (name) => {
      const tabs = document.querySelectorAll('[data-pc-tab]');
      const panes = document.querySelectorAll('[data-pc-pane]');
      tabs.forEach((t) => {
        const on = t.dataset.pcTab === name;
        t.classList.toggle('panel-tab-active', on);
        t.classList.toggle('panel-tab-idle', !on);
      });
      panes.forEach((p) => {
        p.classList.toggle('hidden', p.dataset.pcPane !== name);
      });
    };

    document.querySelectorAll('[data-open-detail]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setSheet('detail');
        setSearch(false);
        activatePcTab('detail');
      });
    });

    document.querySelectorAll('[data-open-ranking]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setSheet('ranking');
        setSearch(false);
      });
    });

    document.querySelectorAll('[data-open-search]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setSearch(true);
      });
    });

    document.querySelectorAll('[data-close-search]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setSearch(false);
      });
    });

    document.querySelectorAll('[data-pc-tab]').forEach((tab) => {
      tab.addEventListener('click', () => activatePcTab(tab.dataset.pcTab));
    });

    document.querySelectorAll('[data-filter-chips]').forEach((group) => {
      group.querySelectorAll('[data-chip]').forEach((chip) => {
        chip.addEventListener('click', () => {
          group.querySelectorAll('[data-chip]').forEach((c) => {
            c.classList.remove('chip-active');
            c.classList.add('chip-idle');
          });
          chip.classList.add('chip-active');
          chip.classList.remove('chip-idle');
        });
      });
    });

    document.querySelectorAll('[data-search-tabs]').forEach((group) => {
      const tabsEl = group.querySelectorAll('[data-search-tab]');
      tabsEl.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabsEl.forEach((t) => {
            const on = t === tab;
            t.classList.toggle('panel-tab-active', on);
            t.classList.toggle('panel-tab-idle', !on);
          });
        });
      });
    });
  });
})();
