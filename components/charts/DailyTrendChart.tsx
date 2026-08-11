"use client"; // Bắt buộc cho Recharts vì nó cần tính toán DOM trên client

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: { date: string; CountBills: number; CancelBills: number }[];
}

export default function DailyTrendChart({ data }: ChartProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Count Bills vs Cancel Bills</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
          <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Line yAxisId="left" type="monotone" dataKey="CountBills" stroke="#007bff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Count Bills" />
          <Line yAxisId="right" type="monotone" dataKey="CancelBills" stroke="#dc3545" strokeWidth={3} dot={{ r: 4 }} name="Cancel Bills" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}