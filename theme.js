/* Wires the light/dark toggle button, and keeps any dual-source logos
   (data-dark / data-light attributes) in sync with the active theme.
   The initial theme itself is set by a tiny inline script in each page's
   <head> (before CSS paints) to avoid a flash of the wrong theme. */
document.addEventListener('DOMContentLoaded', function(){
  var STORAGE_KEY = 'streamline-theme';

  function isLightTheme(){
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function syncLogos(){
    var light = isLightTheme();
    document.querySelectorAll('.card-logo[data-dark][data-light]').forEach(function(img){
      var wanted = light ? img.dataset.light : img.dataset.dark;
      if(img.getAttribute('src') !== wanted) img.setAttribute('src', wanted);
    });
  }

  syncLogos();

  var btn = document.getElementById('themeToggle');
  if(!btn) return;
  btn.addEventListener('click', function(){
    if(isLightTheme()){
      document.documentElement.removeAttribute('data-theme');
      try{ localStorage.setItem(STORAGE_KEY, 'dark'); }catch(e){}
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      try{ localStorage.setItem(STORAGE_KEY, 'light'); }catch(e){}
    }
    syncLogos();
  });
});