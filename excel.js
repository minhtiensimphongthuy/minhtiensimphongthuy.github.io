// Hàm tạo và tải file Excel
function downloadExcel() {
  // Dữ liệu mẫu (bạn có thể thay đổi)
  const data = [
    { STT: 1, Ten: "Nguyen Van A", Tuoi: 25, DiaChi: "Ha Noi" },
    { STT: 2, Ten: "Tran Thi B", Tuoi: 30, DiaChi: "Da Nang" },
    { STT: 3, Ten: "Le Van C", Tuoi: 28, DiaChi: "TP HCM" }
  ];

  // Tạo worksheet từ JSON
  const ws = XLSX.utils.json_to_sheet(data);

  // Tạo workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSach");

  // Xuất file Excel
  XLSX.writeFile(wb, "dulieu.xlsx");
}
