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
// script.js (dán nguyên)
const CONTACT_PHONE = '0978670453';

const LOGOS = {
  viettel: 'logos/viettel.png',
  vinaphone: 'logos/vinaphone.png',
  mobifone: 'logos/mobifone.png',
  vietnamobile: 'logos/vietnamobile.png',
  gmobile: 'logos/gmobile.png',
  itelecom: 'logos/itelecom.png'
};

function $(s){ return document.querySelector(s); }
function formatPhoneDisplay(num){
  const s = String(num).replace(/\D/g,'');
  if(s.length===10) return s.replace(/^(\d{4})(\d{3})(\d{3})$/,'$1.$2.$3');
  if(s.length===11) return s.replace(/^(\d{3})(\d{4})(\d{4})$/,'$1.$2.$3');
  return s;
}
function formatVnd(n){
  if(!n || isNaN(n)) return '-';
  if(n>=1000000) return (Math.round(n/100000)/10)+' triệu đ';
  return n.toLocaleString('vi-VN') + ' đ';
}
function getLogoFor(carrier){
  if(!carrier) return 'https://via.placeholder.com/48?text=logo';
  const key = String(carrier).toLowerCase().replace(/\s+/g,'');
  return LOGOS[key] || 'https://via.placeholder.com/48?text=logo';
}

let SIMS = [];

async function loadAndRender(){
  try{
    const res = await fetch('data.json', {cache:'no-store'});
    SIMS = await res.json();
    if(!Array.isArray(SIMS)) SIMS = [];
  }catch(e){
    console.error('Không load được data.json:', e);
    SIMS = [];
  }
  populateCarrierSelect();
  renderGrid($('#sim-list'), SIMS.slice(0,60));
}

function renderCard(item){
  const card = document.createElement('div');
  card.className = 'sim-card';
  card.innerHTML = `
    <div class="sim-logo"><img src="${getLogoFor(item.carrier)}" alt="${item.carrier}" onerror="this.src='https://via.placeholder.com/48?text=logo'"></div>
    <div style="flex:1">
      <div class="sim-num">${formatPhoneDisplay(item.number)}</div>
      <div class="sim-price">${formatVnd(item.price)}</div>
      <div style="color:#999;font-size:12px">${item.carrier || ''}</div>
    </div>
    <div><button class="btn" onclick="onCall('${CONTACT_PHONE}')">Gọi</button></div>
  `;
  return card;
}

function renderGrid(container, items){
  container.innerHTML = '';
  if(!items || items.length===0){ container.innerHTML = '<div>Không tìm thấy số phù hợp.</div>'; return; }
  items.forEach(it => container.appendChild(renderCard(it)));
}

function populateCarrierSelect(){
  const sel = $('#networkFilter');
  if(!sel) return;
  const carriers = Array.from(new Set(SIMS.map(s => s.carrier).filter(Boolean)));
  sel.innerHTML = '<option value="all">Tất cả nhà mạng</option>';
  carriers.forEach(c=> {
    const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
  });
}

function applyFilters(){
  const q = ($('#q') && $('#q').value || '').replace(/\D/g,'');
  const net = ($('#networkFilter') && $('#networkFilter').value) || 'all';
  const min = parseInt(($('#minPrice').value||'').replace(/\D/g,'')) || 0;
  const maxRaw = ($('#maxPrice').value||'').replace(/\D/g,'');
  const max = maxRaw ? parseInt(maxRaw,10) : Infinity;

  const out = SIMS.filter(s=>{
    if(net!=='all' && s.carrier && s.carrier.toLowerCase()!==net.toLowerCase()) return false;
    if(Number(s.price) < min) return false;
    if(Number(s.price) > max) return false;
    if(q){
      const plain = String(s.number).replace(/\D/g,'');
      if(!plain.includes(q)) return false;
    }
    return true;
  });
  renderGrid($('#sim-list'), out.slice(0,200));
}

function onCall(phone){ window.location.href = 'tel:'+phone; }
window.onCall = onCall;

document.addEventListener('DOMContentLoaded', ()=>{
  loadAndRender();
  $('#filterBtn').addEventListener('click', applyFilters);
  $('#resetBtn').addEventListener('click', ()=>{
    if($('#q')) $('#q').value=''; if($('#minPrice')) $('#minPrice').value=''; if($('#maxPrice')) $('#maxPrice').value=''; if($('#networkFilter')) $('#networkFilter').value='all';
    applyFilters();
  });
});

  // Enter to search
  document.getElementById('q').addEventListener('keypress', (e)=>{ if(e.key === 'Enter'){ page=1; renderPage(); } });

  loadData();
});
