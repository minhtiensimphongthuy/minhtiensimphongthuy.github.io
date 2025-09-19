/* ================== CẤU HÌNH ================== */
const BRAND_NAME   = "SimPhongThuyMinhTien";
const CONTACT_PHONE = "0978670453";
const DATA_FILE     = "data.json"; 
const PAGE_SIZE     = 8;

/* ================== BIẾN TOÀN CỤC ================== */
let SIMS   = [];
let page   = 1;

/* ================== HÀM TIỆN ÍCH ================== */
function $(s){ return document.querySelector(s); }

function formatVND(n){
  if(!n || isNaN(n)) return "-";
  return new Intl.NumberFormat('vi-VN').format(n) + " đ";
}

function formatPhoneDisplay(num){
  const s = String(num).replace(/\D/g,'');
  if(s.length===10) return s.replace(/(\d{4})(\d{3})(\d{3})/,'$1.$2.$3');
  if(s.length===11) return s.replace(/(\d{4})(\d{4})(\d{3})/,'$1.$2.$3');
  return s;
}

function getLogoFor(carrier){
  if(!carrier) return 'https://via.placeholder.com/48?text=logo';
  const LOGOS = {
    viettel:     'logos/viettel.png',
    vinaphone:   'logos/vinaphone.png',
    mobifone:    'logos/mobifone.png',
    vietnamobile:'logos/vietnamobile.png',
    gmobile:     'logos/gmobile.png',
    itelecom:    'logos/itelecom.png'
  };
  const key = String(carrier).toLowerCase().replace(/\s+/g,"");
  return LOGOS[key] || 'https://via.placeholder.com/48?text=logo';
}

/* ================== RENDER UI ================== */
function renderCard(item){
  const card = document.createElement('div');
  card.className = 'sim-card';
  card.innerHTML = `
    <div class="sim-logo">
      <img src="${getLogoFor(item.carrier)}" alt="${item.carrier}" onerror="this.src='https://via.placeholder.com/48?text=logo'"/>
    </div>
    <div class="sim-num">${formatPhoneDisplay(item.number)}</div>
    <div class="sim-meta">${item.carrier || ''} ${item.category || ''}</div>
    <div class="sim-price">${ item.price ? formatVND(item.price) : '' } 
      <a href="tel:${CONTACT_PHONE}">Liên hệ</a>
    </div>
  `;
  return card;
}

function renderGrid(container, items){
  container.innerHTML = '';
  if(!items || items.length===0){
    container.innerHTML = '<div>Không tìm thấy số phù hợp.</div>';
    return;
  }
  items.forEach(it => container.appendChild(renderCard(it)));
}

function renderPagination(total){
  const pages = Math.ceil(total / PAGE_SIZE) || 1;
  const pg = $('#pagination');
  pg.innerHTML = '';
  for(let i=1;i<=pages;i++){
    const b = document.createElement('button');
    b.textContent = i;
    b.style.padding = "6px 8px";
    b.style.border = "1px solid #ddd";
    b.style.cursor = "pointer";
    b.style.background = (i===page ? "#FFbf00" : "#fff");
    b.onclick = ()=>{ page = i; renderPage(); window.scrollTo({top:0,behavior:'smooth'}); };
    pg.appendChild(b);
  }
}

/* ================== FILTER & SEARCH ================== */
function applyFilters(){
  const q   = ($('#q') && $('#q').value || "").replace(/\D/g,'');
  const net = ($('#networkFilter') && $('#networkFilter').value) || 'all';
  const min = parseInt(($('#minPrice') && $('#minPrice').value || "").replace(/\D/g,'')) || 0;
  const max = parseInt(($('#maxPrice') && $('#maxPrice').value || "").replace(/\D/g,'')) || Infinity;

  return SIMS.filter(s=>{
    if(net!=='all' && s.carrier && s.carrier.toLowerCase()!==net.toLowerCase()) return false;
    if(s.price && s.price < min) return false;
    if(s.price && s.price > max) return false;
    if(q){
      const plain = String(s.number).replace(/\D/g,'');
      if(!plain.includes(q)) return false;
    }
    return true;
  });
}

function renderPage(){
  const list = applyFilters();
  const start = (page-1)*PAGE_SIZE;
  const paged = list.slice(start,start+PAGE_SIZE);
  renderGrid($('#sim-list'), paged);
  renderPagination(list.length);
}

/* ================== CARRIER SELECT ================== */
function populateCarrierSelect(){
  const sel = $('#networkFilter');
  if(!sel) return;
  const carriers = Array.from(new Set(SIMS.map(s=>s.carrier).filter(Boolean)));
  sel.innerHTML = '<option value="all">Tất cả nhà mạng</option>';
  carriers.forEach(c=>{
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
}

/* ================== LOAD DATA ================== */
async function loadAndRender(){
  try{
    const res = await fetch(DATA_FILE,{cache:'no-store'});
    SIMS = await res.json();
    if(!Array.isArray(SIMS)) SIMS = [];
  }catch(e){
    console.error("Không load được data.json", e);
    SIMS = [];
  }
  populateCarrierSelect();
  renderPage();
}

/* ================== SỰ KIỆN ================== */
function onCall(phone){ window.location.href = 'tel:'+phone; }
window.onCall = onCall;

document.addEventListener("DOMContentLoaded", ()=>{
  // set brand
  const brand = document.querySelector('.brand');
  if(brand) brand.textContent = BRAND_NAME;

  // update contact
  document.querySelectorAll('.contact-fixed.call').forEach(a=>a.href = "tel:"+CONTACT_PHONE);
  document.querySelectorAll('.contact-fixed.zalo').forEach(a=>a.href = "https://zalo.me/"+CONTACT_PHONE);

  // filter
  $('#filterBtn')?.addEventListener('click', ()=>{ page=1; renderPage(); });
  $('#resetBtn')?.addEventListener('click', ()=>{
    if($('#q')) $('#q').value='';
    if($('#minPrice')) $('#minPrice').value='';
    if($('#maxPrice')) $('#maxPrice').value='';
    if($('#networkFilter')) $('#networkFilter').value='all';
    page=1; renderPage();
  });

  // enter search
  $('#q')?.addEventListener('keypress',(e)=>{ if(e.key==="Enter"){ page=1; renderPage(); } });

  loadAndRender();
});
