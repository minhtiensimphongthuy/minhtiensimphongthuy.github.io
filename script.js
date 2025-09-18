// small behaviors: search demo + example alert on load
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('search');
  btn.addEventListener('click', function(){
    const q = input.value.trim();
    if(!q) { alert('Nhập số cần tìm'); return; }
    alert('Tìm: ' + q + '\n(Trang demo — bạn có thể liên hệ 0978670453 để được hỗ trợ)');
  });
});
