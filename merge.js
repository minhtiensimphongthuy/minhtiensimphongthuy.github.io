const fs = require("fs");
const path = require("path");

// Lấy tất cả file .json trong thư mục hiện tại, trừ data.json (file kết quả)
const files = fs.readdirSync(".")
  .filter(file => path.extname(file) === ".json" && file !== "data.json");

let allData = [];

// Đọc và gộp dữ liệu
files.forEach(file => {
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, "utf8");
    try {
      const data = JSON.parse(raw);
      allData = allData.concat(data);
    } catch (err) {
      console.error(`❌ Lỗi khi đọc file ${file}:`, err.message);
    }
  } else {
    console.warn(`⚠️ File ${file} không tồn tại`);
  }
});

// Đánh lại id từ 1 -> N
allData = allData.map((item, index) => ({
  ...item,
  id: index + 1
}));

// Xuất ra file data.json
fs.writeFileSync("data.json", JSON.stringify(allData, null, 2), "utf8");

console.log("✅ Đã merge xong! Kết quả nằm ở data.json");
