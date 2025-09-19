// excel.js
// Đặt cùng folder với data.json, excel.html

// danh sách file JSON "cần kiểm tra" (bạn có thể mở rộng)
const KNOWN_FILES = ['data.json','data1.json','data2.json','data3.json'];

const sel = document.getElementById('dataFile');
const btn = document.getElementById('btnDownload');
const btnRefresh = document.getElementById('btnRefresh');
const msg = document.getElementById('msg');

function log(t){
  msg.innerText = t || '';
}

// kiểm tra file tồn tại (HEAD request)
async function existsFile(url){
  try{
    const r = await fetch(url, { method:'HEAD', cache:'no-store' });
    return r && r.ok;
  }catch(e){
    return false;
  }
}

// điền dropdown với các file tồn tại
async function populateFiles(){
  sel.innerHTML = '<option>Đang kiểm tra...</option>';
  let found = false;

  for(const f of KNOWN_FILES){
    const ok = await existsFile(f);
    if(ok){
      const o = document.createElement('option');
      o.value = f;
      o.textContent = f;
      sel.appendChild(o);
      found = true;
    }
  }

  if(!found){
    // nếu không tìm thấy file nào, vẫn giữ data.json làm mặc định (nếu có)
    sel.innerHTML = '';
    const o = document.createElement('option');
    o.value = 'data.json';
    o.textContent = 'data.json (mặc định)';
    sel.appendChild(o);
    log('Chưa tìm thấy file trong KNOWN_FILES — dùng data.json nếu có.');
  } else {
    log('Danh sách file đã cập nhật.');
  }
}

// chuẩn hoá payload JSON -> trả về mảng (hoặc null nếu không thể)
function normalizeJsonPayload(payload){
  if(!payload) return null;
  if(Array.isArray(payload)) return payload;

  // nếu object và chứa key 'data' hoặc 'sims'
  if(payload && typeof payload === 'object'){
    if(Array.isArray(payload.data)) return payload.data;
    if(Array.isArray(payload.sims)) return payload.sims;

    // nếu object chứa key mà value là mảng, lấy mảng đầu tiên
    for(const k of Object.keys(payload)){
      if(Array.isArray(payload[k])) return payload[k];
    }
  }
  return null;
}

// tải file JSON và xuất excel
async function downloadExcel(){
  const file = sel.value || 'data.json';
  btn.disabled = true;
  log('Đang tải dữ liệu từ ' + file + ' ...');

  try{
    const res = await fetch(file, { cache:'no-store' });
    if(!res.ok) throw new Error('Không tải được file: ' + res.status);

    const json = await res.json();
    const arr = normalizeJsonPayload(json);

    if(!arr){
      log('File JSON không chứa mảng dữ liệu hợp lệ. Hãy kiểm tra file.');
      btn.disabled = false;
      return;
    }

    if(arr.length === 0){
      log('Dữ liệu rỗng (mảng không có phần tử).');
      btn.disabled = false;
      return;
    }

    // tạo header union của tất cả keys
    const headerKeys = Object.keys(arr.reduce((acc,item)=>{
      if(item && typeof item === 'object'){
        Object.keys(item).forEach(k => { acc[k] = true; });
      }
      return acc;
    }, {}));

    // chuyển JSON -> worksheet với header cố định (đảm bảo cột nhất quán)
    const ws = XLSX.utils.json_to_sheet(arr, { header: headerKeys });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const outName = file.replace(/\.json$/i,'') + '.xlsx';
    XLSX.writeFile(wb, outName);

    log('Hoàn tất: đã tạo ' + outName);
  }catch(err){
    console.error(err);
    log('Lỗi: ' + (err.message || err));
  }finally{
    btn.disabled = false;
  }
}

// refresh danh sách file
async function refreshFiles(){
  log('Kiểm tra file trên server ...');
  await populateFiles();
}

// sự kiện
document.addEventListener('DOMContentLoaded', async ()=>{
  await populateFiles();
  btn.addEventListener('click', downloadExcel);
  btnRefresh.addEventListener('click', refreshFiles);
});
