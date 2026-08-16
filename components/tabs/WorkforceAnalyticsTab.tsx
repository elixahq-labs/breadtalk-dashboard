import React, { memo } from 'react';
import { Users } from 'lucide-react';

function WorkforceAnalyticsTab({ data, utils }: { data: any, utils: any }) {
  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[500px] text-center mb-6 w-full">
      <div className="bg-[#f4f7fe] p-4 rounded-full mb-4">
        <Users className="w-12 h-12 text-[#4318FF]" />
      </div>
      <h2 className="text-2xl font-bold text-[#2b3674] mb-2">Workforce Analytics</h2>
      <p className="text-slate-500 max-w-md leading-relaxed">
        The UI shell is ready. Human Resources metrics (Attendance, Productivity, Payroll, etc.) will be displayed here once the data is integrated.
      </p>
    </div>
  );
}

export default memo(WorkforceAnalyticsTab);