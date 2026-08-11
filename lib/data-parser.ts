import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Tự động tìm thư mục 'data' nằm bên trong dự án
const DATA_DIR = path.join(process.cwd(), 'data');

export async function getDashboardData() {
  let allData: any[] = [];
  
  try {
    const files = fs.readdirSync(DATA_DIR);
    
    // Tìm các file txt (có thể là overall hoặc sample đều được)
    const targetFiles = files.filter(file => file.endsWith('.txt'));

    for (const file of targetFiles) {
      const filePath = path.join(DATA_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      const parsed = Papa.parse(fileContent, {
        header: true,
        delimiter: '|',
        skipEmptyLines: true,
      });
      
      allData = [...allData, ...parsed.data];
    }
    
    return allData;

  } catch (error) {
    console.error("Lỗi khi đọc file từ thư mục:", error);
    return [];
  }
}