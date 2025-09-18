// merge.js
// Usage:
//   node merge.js            -> đọc tất cả .json trong folder hiện tại (trừ data.json) và ghi data.json
//   node merge.js --dir=./data --out=mydata.json
// (không cần thư viện ngoài)
const fs = require("fs");
const path = require("path");

// 📂 Lấy tất cả file .json trong thư mục hiện tại (trừ data.json - file kết quả)
const files = fs.readdirSync(".")
  .filter(file => path.extname(file) === ".json" && file !== "data.json");

let allData = [];

console.log("🔎 Bắt đầu merge dữ liệu từ các file JSON...");
console.log("📂 Danh sách file sẽ merge:", files);

// 📥 Đọc và gộp dữ liệu
files.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);

      if (Array.isArray(data)) {
        allData = allData.concat(data);
        console.log(`✅ Đã đọc file ${file}, số bản ghi: ${data.length}`);
      } else {
        console.warn(`⚠️ File ${file} không phải mảng JSON hợp lệ!`);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi đọc file ${file}:`, err.message);
    }
  } else {
    console.warn(`⚠️ File ${file} không tồn tại!`);
  }
});

// 🔢 Đánh lại id từ 1 -> N
allData = allData.map((item, index) => ({
  ...item,
  id: index + 1
}));

// 💾 Xuất ra file data.json
fs.writeFileSync("data.json", JSON.stringify(allData, null, 2), "utf8");

console.log("🎉 Merge hoàn tất!");
console.log(`📊 Tổng số bản ghi sau khi merge: ${allData.length}`);
console.log("📁 Kết quả đã lưu trong file data.json");


const fs = require("fs");
const path = require("path");

// --- parse simple CLI args ---
const argv = process.argv.slice(2);
const opts = {};
argv.forEach(a => {
  if (a.startsWith("--dir=")) opts.dir = a.split("=")[1];
  if (a.startsWith("--out=")) opts.out = a.split("=")[1];
});
const DIR = opts.dir ? path.resolve(opts.dir) : process.cwd();
const OUT = opts.out || "data.json";

console.log(`\n▶ Merge JSON script`);
console.log(`  Folder: ${DIR}`);
console.log(`  Output: ${OUT}\n`);

// read folder
let files;
try {
  files = fs.readdirSync(DIR);
} catch (err) {
  console.error("❌ Không đọc được thư mục:", DIR, err.message);
  process.exit(1);
}

// filter .json files, bỏ file kết quả
files = files.filter(f => path.extname(f).toLowerCase() === ".json" && f !== OUT);

if (files.length === 0) {
  console.warn("⚠️  Không tìm thấy file .json nào (trừ file output).");
  process.exit(0);
}

console.log(`Tìm thấy ${files.length} file .json để đọc:`);
files.forEach(f => console.log(" -", f));

let allData = [];
let totalRead = 0;
let totalObjects = 0;
let badFiles = 0;

// đọc từng file
files.forEach(file => {
  const fp = path.join(DIR, file);
  if (!fs.existsSync(fp)) {
    console.warn(`⚠️ File ${file} không tồn tại (bỏ qua).`);
    badFiles++;
    return;
  }
  try {
    const raw = fs.readFileSync(fp, "utf8");
    if (!raw.trim()) {
      console.warn(`⚠️ File ${file} rỗng -> bỏ qua.`);
      badFiles++;
      return;
    }
    const parsed = JSON.parse(raw);
    // nếu là mảng thì concat; nếu object thì push
    if (Array.isArray(parsed)) {
      allData = allData.concat(parsed);
      totalObjects += parsed.length;
      console.log(`  ✓ Đã đọc ${file} — ${parsed.length} bản ghi`);
    } else if (typeof parsed === "object" && parsed !== null) {
      allData.push(parsed);
      totalObjects += 1;
      console.log(`  ✓ Đã đọc ${file} — 1 object`);
    } else {
      console.warn(`⚠️ File ${file} không phải JSON object/array -> bỏ qua.`);
      badFiles++;
    }
    totalRead++;
  } catch (err) {
    console.error(`❌ Lỗi khi đọc/parsing ${file}:`, err.message);
    badFiles++;
  }
});

// Deduplicate theo số điện thoại (property "number")
const seen = new Map();
const deduped = [];
let duplicates = 0;
allData.forEach(item => {
  const numKey = item && item.number ? String(item.number).trim() : null;
  if (numKey) {
    if (seen.has(numKey)) {
      // duplicate: giữ bản đầu, bỏ các bản sau
      duplicates++;
    } else {
      seen.set(numKey, true);
      deduped.push(item);
    }
  } else {
    // nếu không có số, vẫn thêm (vì có thể là meta)
    deduped.push(item);
  }
});

// Gán lại id từ 1 -> N
const finalData = deduped.map((item, index) => {
  // giữ các thuộc tính khác, gán id mới (số)
  return { ...item, id: index + 1 };
});

// backup cũ (nếu có)
const outPath = path.join(DIR, OUT);
if (fs.existsSync(outPath)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bakName = `${OUT}.bak.${stamp}.json`;
  const bakPath = path.join(DIR, bakName);
  try {
    fs.copyFileSync(outPath, bakPath);
    console.log(`\n🔒 Tạo bản backup: ${bakName}`);
  } catch (err) {
    console.warn("⚠️ Không tạo được backup:", err.message);
  }
}

// ghi file kết quả
try {
  fs.writeFileSync(outPath, JSON.stringify(finalData, null, 2), "utf8");
  console.log(`\n✅ Ghi thành công ${OUT}`);
  console.log(`  File gốc đã đọc: ${totalRead}`);
  console.log(`  Tổng bản ghi (trước dedupe): ${totalObjects}`);
  console.log(`  Bản ghi sau dedupe: ${finalData.length}`);
  console.log(`  Trùng bị loại: ${duplicates}`);
  if (badFiles) console.log(`  Files bị lỗi / bỏ qua: ${badFiles}`);
  console.log("\nHoàn tất.\n");
} catch (err) {
  console.error("❌ Lỗi khi ghi file:", err.message);
  process.exit(1);
}
