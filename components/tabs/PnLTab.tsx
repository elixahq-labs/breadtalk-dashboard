import React, { memo } from 'react';
import { DollarSign } from 'lucide-react';

function PnLTab({ data, utils }: { data: any, utils: any }) {
  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[500px] text-center mb-6 w-full">
      <div className="bg-emerald-50 p-4 rounded-full mb-4">
        <DollarSign className="w-12 h-12 text-[#00d084]" />
      </div>
      <h2 className="text-2xl font-bold text-[#2b3674] mb-2">Profit & Loss (P&L) Statement</h2>
      <p className="text-slate-500 max-w-md leading-relaxed">
        The UI shell is connected. Data from the <b>PnL.py</b> file will be mapped here to calculate Net Profit after deducting OPEX & COGS.
      </p>
    </div>
  );
}

export default memo(PnLTab);