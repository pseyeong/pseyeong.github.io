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

    document.querySelectorAll('.infoClick').forEach((el) => {
      el.addEventListener('click', () => {
        el.querySelector('.infoBox')?.classList.toggle('hidden');
      });
    });

    // 데이터 안내 모달 (모바일 지도 위 i 버튼): 닫기 버튼, 딤 배경, Esc 로 닫는다
    const infoModal = document.querySelector('[data-info-modal]');
    if (infoModal) {
      const setInfoOpen = (open) => {
        infoModal.classList.toggle('hidden', !open);
        infoModal.classList.toggle('flex', open);
      };
      document.querySelectorAll('[data-info-open]').forEach((el) => {
        el.addEventListener('click', () => setInfoOpen(true));
      });
      infoModal.querySelectorAll('[data-info-close]').forEach((el) => {
        el.addEventListener('click', () => setInfoOpen(false));
      });
      infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) setInfoOpen(false); // 흰 상자 바깥(딤)만
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setInfoOpen(false);
      });
    }

    document.querySelectorAll('.filterBtn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chips = btn.nextElementSibling;
        if (!chips || !chips.hasAttribute('data-filter-chips')) return;
        const open = chips.classList.toggle('hidden');
        btn.setAttribute('aria-expanded', String(!open));
      });
    });
  });
})();
