import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

function InventoryTab({ data, utils }: { data: any, utils: any }) {
  const { formatUS } = utils;

  return (
    <>
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-6 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-6 text-[#2b3674]">Operation Reconciliation — Pending Tickets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#f4f7fe] p-4 rounded-2xl border border-slate-50"><p className="text-xs text-slate-500 font-medium truncate">Buying-Ticket</p><p className="text-xl sm:text-2xl font-bold mt-2 text-[#2b3674]">{formatUS(data.pendingStats.buying)}</p></div>
          <div className="bg-[#f4f7fe] p-4 rounded-2xl border border-slate-50"><p className="text-xs text-slate-500 font-medium truncate">Process-Ticket</p><p className="text-xl sm:text-2xl font-bold mt-2 text-[#2b3674]">{formatUS(data.pendingStats.process)}</p></div>
          <div className="bg-[#f4f7fe] p-4 rounded-2xl border border-slate-50"><p className="text-xs text-slate-500 font-medium truncate">Import-Ticket</p><p className="text-xl sm:text-2xl font-bold mt-2 text-[#2b3674]">{formatUS(data.pendingStats.import)}</p></div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100"><p className="text-xs text-red-600 font-bold truncate">Missing Waste-Ticket</p><p className="text-xl sm:text-2xl font-black mt-2 text-red-600">{formatUS(data.pendingStats.missingWaste)}</p></div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100"><p className="text-xs text-red-600 font-bold truncate">Missing Stock-Ticket</p><p className="text-xl sm:text-2xl font-black mt-2 text-red-600">{formatUS(data.pendingStats.missingStock)}</p></div>
        </div>
        <div className="overflow-y-auto overflow-x-auto max-h-[350px]">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-3 px-3 font-semibold">Store</th><th className="pb-3 px-3 font-semibold">Date</th><th className="pb-3 px-3 font-semibold">Ticket Type</th><th className="pb-3 px-3 font-semibold text-center">Qty</th><th className="pb-3 px-3 font-semibold text-center">Aging Days</th>
              </tr>
            </thead>
            <tbody>
              {data.agingTickets.map((ticket:any, idx:number) => {
                const isCritical = ticket.aging > 5 && !ticket.isMissing;
                let rowClass = 'text-slate-700 hover:bg-slate-50 transition-colors';
                if (ticket.isMissing) rowClass = 'bg-red-50 text-red-800 font-bold border-l-4 border-l-red-500';
                else if (isCritical) rowClass = 'bg-orange-50 text-orange-700 font-semibold border-l-4 border-l-orange-400';

                return (
                  <tr key={idx} className={`border-b border-slate-50 ${rowClass}`}>
                    <td className="py-3 px-3 text-xs sm:text-sm">{ticket.store}</td>
                    <td className="py-3 px-3 text-xs sm:text-sm font-medium">{ticket.date}</td>
                    <td className="py-3 px-3 text-xs sm:text-sm">{ticket.type}</td>
                    <td className="py-3 px-3 text-center text-xs sm:text-sm">{ticket.qty === 'N/A' ? '-' : formatUS(ticket.qty)}</td>
                    <td className="py-3 px-3 text-center flex items-center justify-center gap-1 text-xs sm:text-sm">
                      {formatUS(ticket.aging)} {(isCritical || ticket.isMissing) && <AlertTriangle size={14} className={ticket.isMissing ? "text-red-500" : "text-orange-500"} />}
                    </td>
                  </tr>
                );
              })}
              {data.agingTickets.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-slate-400 font-medium">Great! No pending or missing tickets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4 text-[#2b3674]">Inventory GAP Table (GAP ≠ 0)</h3>
        <div className="overflow-y-auto overflow-x-auto max-h-[1000px] mt-2 relative">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-3 px-3 font-semibold">Group</th><th className="pb-3 px-3 font-semibold">SKU</th><th className="pb-3 px-3 font-semibold">Product-Name</th>
                <th className="pb-3 px-3 font-semibold text-right">Open</th><th className="pb-3 px-3 font-semibold text-right">Process</th><th className="pb-3 px-3 font-semibold text-right">Import</th><th className="pb-3 px-3 font-semibold text-right">Export</th><th className="pb-3 px-3 font-semibold text-right">Sales</th><th className="pb-3 px-3 font-semibold text-right">Waste</th><th className="pb-3 px-3 font-semibold text-right">Stock</th><th className="pb-3 px-3 font-bold text-right text-slate-800">GAP</th>
              </tr>
            </thead>
            <tbody>
              {data.gapData.map((row:any, idx:number) => (
                <tr key={idx} className="border-b border-slate-50 text-slate-600 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-3 text-xs sm:text-sm font-medium">{row.group}</td>
                  <td className="py-4 px-3 text-xs sm:text-sm">{row.sku}</td>
                  <td className="py-4 px-3 font-semibold text-slate-800 whitespace-normal break-words min-w-[250px] sm:min-w-[300px] leading-snug">{row.name}</td>
                  <td className="py-4 px-3 text-right text-xs sm:text-sm">{formatUS(row.open)}</td><td className="py-4 px-3 text-right text-xs sm:text-sm">{formatUS(row.process)}</td><td className="py-4 px-3 text-right text-xs sm:text-sm">{formatUS(row.import)}</td><td className="py-4 px-3 text-right text-xs sm:text-sm">{formatUS(row.export)}</td><td className="py-4 px-3 text-right text-xs sm:text-sm">{formatUS(row.sales)}</td><td className="py-4 px-3 text-right text-xs sm:text-sm">{formatUS(row.waste)}</td><td className="py-4 px-3 text-right text-xs sm:text-sm font-medium">{formatUS(row.stock)}</td>
                  <td className={`py-4 px-3 text-right font-black text-sm sm:text-base ${row.gap < 0 ? 'text-red-500' : 'text-orange-500'}`}>{formatUS(row.gap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default memo(InventoryTab);