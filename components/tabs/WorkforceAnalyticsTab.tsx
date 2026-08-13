import React from 'react';
import { Users } from 'lucide-react';

export default function WorkforceAnalyticsTab({ data, utils }: { data: any, utils: any }) {
  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <Users className="w-12 h-12 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Workforce Analytics</h2>
      <p className="text-gray-500 max-w-md">
        The UI shell is ready. Human Resources metrics (Attendance, Productivity, Payroll, etc.) will be displayed here once the data is integrated.
      </p>
    </div>
  );
}