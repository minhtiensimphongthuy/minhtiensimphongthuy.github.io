/* CẤU HÌNH - dễ sửa */
const BRAND_NAME = "SimPhongThuyMinhTien";
const CONTACT_PHONE = "0978670453";
const DATA_FILE = "data.json"; // file data (đổi tên nếu cần)
const PAGE_SIZE = 8;

/* --- code --- */
let allData = [];
let page = 1;

function formatVND(n){
  if(!n && n !== 0) return "";
  return new Intl.NumberFormat('vi-VN').format(n) + " ₫";
}

function loadData(){
  fetch(DATA_FILE)
    .then(r=>r.json())
    .then(data=>{
      allData = data;
      populateCarrierFilter();
      renderPage();
    })
    .catch(err=>{
      console.error("Lỗi load data:", err);
      document.getElementById('sim-list').innerHTML = "<p>Không thể tải dữ liệu. Hãy kiểm tra data.json</p>";
    });
}

function populateCarrierFilter(){
  const carriers = [...new Set(allData.map(x=>x.carrier).filter(Boolean))].sort();
  const sel = document.getElementById('carrier');
  const side = document.getElementById('sidebar-carriers');
  carriers.forEach(c=>{
    const opt = document.createElement('option'); opt.value=c; opt.textContent=c; sel.appendChild(opt);

    const li = document.createElement('li'); li.textContent = c; side.appendChild(li);
  });
}

function applyFilterAndSearch(){
  const q = (document.getElementById('q').value || "").trim();
  const carrier = document.getElementById('carrier').value;
  const min = Number(document.getElementById('minPrice').value || 0);
  const maxVal = document.getElementById('maxPrice').value;
  const max = maxVal ? Number(maxVal) : Infinity;

  let res = allData.filter(item=>{
    if(q && !item.number.includes(q)) return false;
    if(carrier && item.carrier !== carrier) return false;
    if(item.price === undefined || item.price === null) return true;
    if(item.price < min) return false;
    if(item.price > max) return false;
    return true;
  });

  return res;
}

function renderPage(){
  const list = applyFilterAndSearch();
  page = Math.max(1, page);
  const start = (page-1)*PAGE_SIZE;
  const paged = list.slice(start, start+PAGE_SIZE);

  const cont = document.getElementById('sim-list');
  cont.innerHTML = "";

  paged.forEach(item=>{
    const card = document.createElement('div'); card.className = "sim-card" + (item.featured ? " featured": "");
    card.innerHTML = `
      <div class="sim-logo">${getCarrierIconLetter(item.carrier)}</div>
      <div>
        <div class="sim-number">${formatNumberHighlight(item.number)}</div>
        <div class="sim-meta">${item.carrier} • ${item.category || ''}</div>
      </div>
      <div class="sim-price">${ item.price ? formatVND(item.price) : '<a href="tel:'+CONTACT_PHONE+'">Liên hệ</a>'}</div>
    `;
    cont.appendChild(card);
  });

  renderPagination(list.length);
}

function formatNumberHighlight(num){
  // optional: make middle part colored like sample: we keep full number
  return num;
}

function renderPagination(total){
  const pages = Math.ceil(total / PAGE_SIZE) || 1;
  const pg = document.getElementById('pagination');
  pg.innerHTML = "";
  for(let i=1;i<=pages;i++){
    const b = document.createElement('button');
    b.textContent = i;
    b.style.padding="6px 8px";
    b.style.border="1px solid #ddd";
    b.style.background = (i===page ? "#ffbf00" : "#fff");
    b.style.cursor = "pointer";
    b.onclick = ()=>{ page = i; renderPage(); window.scrollTo({top:0,behavior:'smooth'}); };
    pg.appendChild(b);
  }
}

/* small helper: for icon letter */
function getCarrierIconLetter(c){
  if(!c) return "S";
  return c.charAt(0).toUpperCase();
}

/* events */
document.addEventListener("DOMContentLoaded", ()=>{
  // set brand text in header (optional)
  const brand = document.querySelector('.brand');
  if(brand) brand.textContent = BRAND_NAME;

  // default contact phone (update hrefs)
  document.querySelectorAll('.contact-fixed .call').forEach(a=>a.href = "tel:"+CONTACT_PHONE);
  document.querySelectorAll('.contact-fixed .zalo').forEach(a=>a.href = "https://zalo.me/"+CONTACT_PHONE);

  document.getElementById('filterBtn').addEventListener('click', ()=>{
    page = 1; renderPage();
  });
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    document.getElementById('q').value = "";
    document.getElementById('carrier').value = "";
    document.getElementById('minPrice').value = "";
    document.getElementById('maxPrice').value = "";
    page = 1; renderPage();
  });

  // Enter to search
  document.getElementById('q').addEventListener('keypress', (e)=>{ if(e.key === 'Enter'){ page=1; renderPage(); } });

  loadData();
});
