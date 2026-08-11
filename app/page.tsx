import fs from 'fs';
import path from 'path';
import DashboardClient from '../components/DashboardClient';

export default function DashboardPage() {
  // Trỏ vào thư mục public/data
  const dataDir = path.join(process.cwd(), 'public', 'data');
  let fileNames: string[] = [];

  try {
    const files = fs.readdirSync(dataDir);
    // Chỉ lấy tên các file txt
    fileNames = files.filter(f => f.endsWith('.txt'));
  } catch (e) {
    console.error("Không tìm thấy thư mục data", e);
  }

  // Truyền mỗi cái danh sách tên file xuống cho Giao diện
  return (
    <main>
      <DashboardClient fileNames={fileNames} />
    </main>
  );
}