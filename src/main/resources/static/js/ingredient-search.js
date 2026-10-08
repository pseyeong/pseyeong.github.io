/*
 * 재료 자동완성 (이름·별칭으로 찾는다)
 * 마크업: <form data-ingredient-form> 안에 input[data-ingredient-input], ul[data-suggest-list]
 * 후보를 고르면 input 에 이름을 넣고 폼을 제출한다 (서버가 선택 목록에 더해 다시 그린다).
 * 6단계 레시피 작성에서도 같은 API(/api/ingredients/suggest)를 쓴다.
 */
(function () {
  var form = document.querySelector('[data-ingredient-form]');
  if (!form) return;
  var input = form.querySelector('[data-ingredient-input]');
  var list = form.querySelector('[data-suggest-list]');
  var timer = null;
  var active = -1;

  function close() {
    list.hidden = true;
    list.innerHTML = '';
    active = -1;
  }

  function choose(name) {
    input.value = name;
    form.submit();
  }

  function render(items) {
    list.innerHTML = '';
    if (!items.length) return close();
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.className = 'suggest-item';
      li.textContent = item.name;
      if (item.alias) {
        var alias = document.createElement('span');
        alias.className = 'suggest-alias';
        alias.textContent = item.alias;
        li.appendChild(alias);
      }
      // mousedown: 입력창이 blur 로 닫히기 전에 처리한다
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        choose(item.name);
      });
      list.appendChild(li);
    });
    active = -1;
    list.hidden = false;
  }

  function highlight(next) {
    var items = list.children;
    if (!items.length) return;
    if (active >= 0) items[active].classList.remove('suggest-item-active');
    active = (next + items.length) % items.length;
    items[active].classList.add('suggest-item-active');
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value.trim();
    if (!q) return close();
    timer = setTimeout(function () {
      fetch('/api/ingredients/suggest?q=' + encodeURIComponent(q))
        .then(function (res) { return res.ok ? res.json() : []; })
        .then(function (items) {
          if (input.value.trim() === q) render(items); // 늦게 온 응답은 버린다
        })
        .catch(close);
    }, 150);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (e.key === 'Escape') { close(); }
    else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(list.children[active].firstChild.textContent);
    }
  });

  input.addEventListener('blur', close);
})();
