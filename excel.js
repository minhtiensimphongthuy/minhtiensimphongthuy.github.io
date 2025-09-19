// excel.js
// Gợi ý: đặt cùng folder với data.json, excel.html

const KNOWN_FILES = ['data.json','data1.json','data2.json']; // nếu bạn có thêm đổi danh sách ở đây
const sel = document.getElementById('dataFile');
const btn = document.getElementById('btnDownload');
const btnRefresh = document.getElementById('btnRefresh');
const msg = document.getElementById('msg');

function log(m){
  msg.textContent = m;
}

// kiểm tra file tồn tại (dùng fetch HEAD)
async function existsFile(url){
  try{
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return r.ok;
  }catch(e){
    return false;
  }
}

// populate dropdown với các file tồn tại
async function populateFiles(){
  sel.innerHTML = '';
  let foundAny = false;
  for(const f of KNOWN_FILES){
    const ok = await existsFile(f);
    if(ok){
      const o = document.createElement('option');
      o.value = f; o.textContent = f;
      sel.appendChild(o);
      foundAny = true;
    }
  }
  // nếu không tìm thấy file nào trong KNOWN_FILES, thêm default data.json
  if(!foundAny){
    const o = document.createElement('option');
    o.value = 'data.json'; o.textContent = 'data.json';
    sel.appendChild(o);
    log('Chưa tìm thấy file mẫu, mặc định sử dụng data.json (bạn có thể commit data.json lên).');
  } else {
    log('Đã tìm thấy file dữ liệu trên server.');
  }
}

// chuẩn hóa dữ liệu: nếu file trả về object chứa mảng ở key 'data' hoặc 'sims'
function normalizeJsonPayload(j){
  if(Array.isArray(j)) return j;
  if(j && Array.isArray(j.data)) return j.data;
  if(j && Array.isArray(j.sims)) return j.sims;
  // nếu là object với các object con, cố gắng chuyển sang array các object con
  return null;
}

async function downloadExcel(){
  const file = sel.value || 'data.json';
  btn.disabled = true;
  log('Đang tải dữ liệu từ ' + file + ' ...');

  try{
    const res = await fetch(file, { cache: 'no-store' });
    if(!res.ok) throw new Error('Không tải được file: ' + res.status);

    const j = await res.json();
    let arr = normalizeJsonPayload(j);
    if(arr === null){
      // chưa phải mảng -> thông báo
      log('File JSON không chứa mảng dữ liệu (hoặc có key khác). Hãy kiểm tra file.');
      btn.disabled = false;
      return;
    }

    if(arr.length === 0){
      log('Dữ liệu rỗng (mảng không có phần tử).');
      btn.disabled = false;
      return;
    }

    // chuẩn hóa các key (tạo header từ tập hợp key)
    const headerKeys = Object.keys(arr.reduce((acc, it) => Object.assign(acc, it || {}), {}));

    // tạo worksheet từ JSON với header cố định (đảm bảo cột cố định)
    const ws = XLSX.utils.json_to_sheet(arr, { header: headerKeys });

    // sửa format: nếu muốn, có thể ép kiểu cột (bỏ ở bản này)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const outName = file.replace(/\.json$/i, '') + '.xlsx';
    XLSX.writeFile(wb, outName);

    log('Hoàn tất: đã tạo ' + outName);
  }catch(err){
    console.error(err);
    log('Lỗi: ' + (err.message || err));
  }finally{
    btn.disabled = false;
  }
}

// refresh/kiểm tra file tồn tại
async function refreshFiles(){
  log('Kiểm tra file trên server ...');
  await populateFiles();
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await populateFiles();
  btn.addEventListener('click', downloadExcel);
  btnRefresh.addEventListener('click', refreshFiles);
});
