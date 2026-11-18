(function () {
  try {
    var t = localStorage.getItem('murdoku_theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.classList.add('theme-' + t);
    }
  } catch {}
})();
