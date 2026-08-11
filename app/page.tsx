import { getDashboardData } from '@/lib/data-parser';
import DashboardClient from '../components/DashboardClient';

export default async function DashboardPage() {
  // Lấy dữ liệu SỐNG từ các file overall*.txt trên OneDrive
  const rawData = await getDashboardData();

  return (
    <main>
      {/* Ném cục data sang cho Client Component để xử lý filter tương tác */}
      <DashboardClient rawData={rawData} />
    </main>
  );
}