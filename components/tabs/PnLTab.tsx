import React from 'react';
import { DollarSign } from 'lucide-react';

export default function PnLTab({ data, utils }: { data: any, utils: any }) {
  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="bg-green-50 p-4 rounded-full mb-4">
        <DollarSign className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Profit & Loss (P&L) Statement</h2>
      <p className="text-gray-500 max-w-md">
        Khung giao diện đã được kết nối. Dữ liệu từ file <b>PnL.py</b> sẽ được map vào đây để tính toán Lợi nhuận thuần sau khi trừ các chi phí OPEX & COGS.
      </p>
    </div>
  );
}