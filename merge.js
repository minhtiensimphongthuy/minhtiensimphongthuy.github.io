// merge.js
// Usage:
//   node merge.js            -> đọc tất cả .json trong folder hiện tại (trừ file out) và ghi data.json
//   node merge.js --dir=./data --out=mydata.json
// Yêu cầu: node >= 8

const fs = require("fs");
const path = require("path");

// parse simple CLI args
const argv = process.argv.slice(2);
const opts = {};
argv.forEach(a => {
  if (a.startsWith("--dir=")) opts.dir = a.split("=")[1];
  if (a.startsWith("--out=")) opts.out = a.split("=")[1];
});

const DIR = opts.dir ? path.resolve(opts.dir) : process.cwd();
const OUT = opts.out || "data.json";

console.log(`\n➡️  Merge JSON script`);
console.log(`  Folder: ${DIR}`);
console.log(`  Output: ${OUT}\n`);

// đọc folder
let files;
try {
  files = fs.readdirSync(DIR);
} catch (err) {
  console.error("❌ Không đọc được thư mục:", DIR, err.message);
  process.exit(1);
}

// lọc file .json (trừ file output)
files = files.filter(f => path.extname(f).toLowerCase() === ".json" && f !== OUT);

if (files.length === 0) {
  console.warn("⚠️  Không tìm thấy file .json nào (trừ file output).");
  process.exit(0);
}

console.log(`Tìm thấy ${files.length} file .json sẽ merge:`);
files.forEach(f => console.log("  -", f));

let allData = [];
let totalReadFiles = 0;
let totalObjects = 0;
let badFiles = 0;
let totalObjectsBefore = 0;

// đọc từng file
files.forEach(file => {
  const fp = path.join(DIR, file);
  if (!fs.existsSync(fp)) {
    console.warn(`⚠️  File ${file} không tồn tại -> bỏ qua`);
    badFiles++;
    return;
  }
  try {
    const raw = fs.readFileSync(fp, "utf8");
    if (!raw.trim()) {
      console.warn(`⚠️  File ${file} rỗng -> bỏ qua`);
      badFiles++;
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      allData = allData.concat(parsed);
      totalObjects += parsed.length;
      console.log(`✅ Đã đọc ${file} - ${parsed.length} bản ghi`);
    } else if (typeof parsed === "object" && parsed !== null) {
      allData.push(parsed);
      totalObjects += 1;
      console.log(`✅ Đã đọc ${file} - 1 object`);
    } else {
      console.warn(`⚠️  File ${file} không phải JSON object/array -> bỏ qua`);
      badFiles++;
      return;
    }
    totalReadFiles++;
  } catch (err) {
    console.error(`❌ Lỗi khi đọc/parsing ${file}:`, err.message);
    badFiles++;
  }
});

totalObjectsBefore = totalObjects;

// dedupe theo trường "number" (giữ bản đầu gặp, bỏ các bản sau)
const seen = new Map();
const deduped = [];
let duplicates = 0;

allData.forEach(item => {
  const numKey = item && item.number ? String(item.number).trim() : null;
  if (numKey) {
    if (seen.has(numKey)) {
      duplicates++;
      return;
    }
    seen.set(numKey, true);
    deduped.push(item);
  } else {
    // nếu item không có number vẫn giữ (có thể là meta)
    deduped.push(item);
  }
});

// gán lại id từ 1 -> N
const finalData = deduped.map((it, idx) => ({ ...it, id: idx + 1 }));

// backup nếu file out đã tồn tại
const outPath = path.join(DIR, OUT);
if (fs.existsSync(outPath)) {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const bakName = `${OUT}.bak.${stamp}`;
    fs.copyFileSync(outPath, path.join(DIR, bakName));
    console.log(`🔐 Tạo backup: ${bakName}`);
  } catch (err) {
    console.warn("⚠️ Không tạo được backup:", err.message);
  }
}

// ghi file kết quả
try {
  fs.writeFileSync(outPath, JSON.stringify(finalData, null, 2), "utf8");
  console.log(`\n✅ Ghi thành công: ${OUT}`);
  console.log(`  - Files đọc: ${totalReadFiles}/${files.length}`);
  console.log(`  - Tổng bản ghi (trước dedupe): ${totalObjectsBefore}`);
  console.log(`  - Bản ghi sau dedupe: ${finalData.length}`);
  console.log(`  - Bị loại duplicate (cùng number): ${duplicates}`);
  if (badFiles) console.log(`  - Files lỗi/bỏ qua: ${badFiles}`);
  console.log("\nHoàn tất.\n");
} catch (err) {
  console.error("❌ Lỗi khi ghi file:", err.message);
  process.exit(1);
}
