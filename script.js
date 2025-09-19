/* script.js - render sim từ data.json */
/* CẬP NHẬT SỐ LIÊN HỆ Ở ĐÂY */
const CONTACT_PHONE = '097867453'; // <-- số Zalo / Hotline bạn muốn
const DATA_FILE = 'data.json';
const PAGE_SIZE = 12; // số card hiển thị 1 trang

// mapping tên nhà mạng -> logo (nếu bạn thêm file logo vào thư mục logos/ thì đổi đường dẫn)
const LOGOS = {
  "viettel": "https://via.placeholder.com/80?text=Viettel",
  "vinaphone": "https://via.placeholder.com/80?text=Vinaphone",
  "mobifone": "https://via.placeholder.com/80?text=Mobifone",
  "vietnamobile": "https://via.placeholder.com/80?text=VNM",
  "gmobile": "https://via.placeholder.com/80?text=Gmobile",
  "itelecom": "https://via.placeholder.com/80?text=iTel"
};

let SIMS = []; // data loaded
let page = 1;

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
function formatVnd(n){
  if(n === undefined || n === null || isNaN(Number(n))) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ';
}
function formatPhoneDisplay(num){
  if(!num) return '';
  const s = String(num).replace(/\D/g,'');
  if(s.length===10) return s.replace(/(\d{3})(\d{3})(\d{4})/,'$1.$2.$3');
  if(s.length===11) return s.replace(/(\d{3})(\d{4})(\d{4})/,'$1.$2.$3');
  return num;
}
function getLogoFor(carrier){
  if(!carrier) return 'https://via.placeholder.com/80?text=logo';
  const key = String(carrier).toLowerCase().replace(/\s+/g,'');
  return LOGOS[key] || 'https://via.placeholder.com/80?text=logo';
}

async function loadAndRender(){
  document.getElementById('contactPhone').textContent = CONTACT_PHONE;
  document.getElementById('callBtn').href = 'tel:' + CONTACT_PHONE;
  document.getElementById('zaloBtn').href = 'https://zalo.me/' + CONTACT_PHONE;

  try{
    const res = await fetch(DATA_FILE + '?_='+(Date.now()));
    SIMS = await res.json();
    if(!Array.isArray(SIMS)) SIMS = [];
  }catch(e){
    console.error('Không load được data.json', e);
    SIMS = [];
  }

  // dedupe theo number (giữ bản đầu)
  const seen = new Set();
  SIMS = SIMS.filter(it => {
    const key = it && it.number ? String(it.number).replace(/\D/g,'') : null;
    if(!key) return true;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  populateCarrierSelect();
  renderPage();
}

function populateCarrierSelect(){
  const sel = $('#networkFilter');
  const carriers = Array.from(new Set(SIMS.map(s=> (s.carrier||'').trim()).filter(Boolean))).sort();
  // reset but keep "all"
  sel.innerHTML = '<option value="all">Tất cả nhà mạng</option>';
  carriers.forEach(c=>{
    const o = document.createElement('option');
    o.value = c.toLowerCase();
    o.textContent = c;
    sel.appendChild(o);
  });

  // sidebar list
  const side = $('#sidebar-carriers');
  if(side){
    side.innerHTML = '';
    carriers.forEach(c=>{
      const li = document.createElement('li');
      li.textContent = c;
      side.appendChild(li);
    });
  }
}

function applyFiltersAndSearch(){
  const q = ($('#q') && $('#q').value || '').replace(/\D/g,'');
  const net = ($('#networkFilter') && $('#networkFilter').value) || 'all';
  const min = Number(($('#minPrice') && $('#minPrice').value || '').replace(/\D/g,'')) || 0;
  const maxRaw = ($('#maxPrice') && $('#maxPrice').value || '').replace(/\D/g,'');
  const max = maxRaw ? Number(maxRaw) : Infinity;

  const out = SIMS.filter(s=>{
    if(net !== 'all' && s.carrier && s.carrier.toLowerCase() !== net.toLowerCase()) return false;
    const price = (s.price === undefined || s.price === null) ? null : Number(s.price);
    if(price !== null){
      if(price < min) return false;
      if(price > max) return false;
    }
    if(q && s.number){
      const plain = String(s.number).replace(/\D/g,'');
      if(!plain.includes(q)) return false;
    }
    return true;
  });
  return out;
}

function renderCard(item){
  const card = document.createElement('div');
  card.className = 'sim-card' + (item.featured ? ' featured' : '');
  const logo = getLogoFor(item.carrier);
  card.innerHTML = `
    <div class="logo"><img src="${logo}" alt="${item.carrier||''}" style="width:56px;height:56px;border-radius:50%" onerror="this.src='https://via.placeholder.com/80?text=logo'"></div>
    <div style="flex:1">
      <div class="sim-num">${formatPhoneDisplay(item.number)}</div>
      <div class="sim-meta">${item.carrier || ''} ${item.category ? ' • ' + item.category : ''}</div>
    </div>
    <div class="sim-price">
      ${item.price ? formatVnd(item.price) : `<a href="tel:${CONTACT_PHONE}">Liên hệ</a>`}
      <div class="sim-meta" style="font-size:12px;margin-top:4px">${item.installment ? 'Góp ' + formatVnd(item.installment) + '/tháng' : ''}</div>
      <div style="margin-top:6px"><button class="btn-call" onclick="window.location='tel:${CONTACT_PHONE}'">Gọi</button></div>
    </div>
  `;
  return card;
}

function renderPage(){
  const out = applyFiltersAndSearch();
  const total = out.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if(page > pages) page = pages;

  const start = (page-1)*PAGE_SIZE;
  const paged = out.slice(start, start+PAGE_SIZE);

  const cont = $('#sim-list');
  cont.innerHTML = '';
  if(paged.length === 0){
    cont.innerHTML = '<div style="padding:20px;background:#fff;border-radius:6px">Không tìm thấy số phù hợp.</div>';
  } else {
    paged.forEach(it => cont.appendChild(renderCard(it)));
  }

  renderPagination(pages);
}

function renderPagination(pages){
  const pg = $('#pagination');
  pg.innerHTML = '';
  for(let i=1;i<=pages;i++){
    const b = document.createElement('button');
    b.textContent = i;
    b.style.padding = '6px 8px';
    b.style.margin = '0 4px';
    if(i===page) { b.style.background = '#ffbf00'; b.style.border = '1px solid #ffbf00' }
    b.onclick = ()=>{ page = i; renderPage(); window.scrollTo({top:120,behavior:'smooth'}); };
    pg.appendChild(b);
  }
}

/* events */
document.addEventListener('DOMContentLoaded', ()=>{
  $('#filterBtn').addEventListener('click', ()=>{ page=1; renderPage(); });
  $('#resetBtn').addEventListener('click', ()=>{
    $('#q').value=''; $('#networkFilter').value='all'; $('#minPrice').value=''; $('#maxPrice').value=''; page=1; renderPage();
  });
  $('#q').addEventListener('keypress',(e)=>{ if(e.key === 'Enter'){ page=1; renderPage(); }});
  loadAndRender();
});
