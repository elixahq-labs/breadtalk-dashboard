import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function InventoryTab({ data, utils }: { data: any, utils: any }) {
  const { formatUS } = utils;

  return (
    <>
      {/* BẢNG PENDING TICKETS */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4">Operation Reconciliation — Pending Tickets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Buying-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(data.pendingStats.buying)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Process-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(data.pendingStats.process)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Import-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(data.pendingStats.import)}</p></div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-xs text-red-600 truncate font-semibold">Missing Waste-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{formatUS(data.pendingStats.missingWaste)}</p></div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-xs text-red-600 truncate font-semibold">Missing Stock-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{formatUS(data.pendingStats.missingStock)}</p></div>
        </div>
        <div className="overflow-y-auto overflow-x-auto max-h-[350px]">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-2 font-medium">Store</th><th className="pb-3 px-2 font-medium">Date</th><th className="pb-3 px-2 font-medium">Ticket Type</th><th className="pb-3 px-2 font-medium text-center">Qty</th><th className="pb-3 px-2 font-medium text-center">Aging Days</th>
              </tr>
            </thead>
            <tbody>
              {data.agingTickets.map((ticket:any, idx:number) => {
                const isCritical = ticket.aging > 5 && !ticket.isMissing;
                let rowClass = 'text-gray-700 hover:bg-gray-50';
                if (ticket.isMissing) rowClass = 'bg-red-100 text-red-800 font-bold border-l-4 border-l-red-600';
                else if (isCritical) rowClass = 'bg-orange-50 text-orange-700 font-medium';

                return (
                  <tr key={idx} className={`border-b border-gray-100 ${rowClass}`}>
                    <td className="py-2 px-2 text-xs sm:text-sm">{ticket.store}</td>
                    <td className="py-2 px-2 text-xs sm:text-sm">{ticket.date}</td>
                    <td className="py-2 px-2 text-xs sm:text-sm">{ticket.type}</td>
                    <td className="py-2 px-2 text-center text-xs sm:text-sm">{ticket.qty === 'N/A' ? '-' : formatUS(ticket.qty)}</td>
                    <td className="py-2 px-2 text-center flex items-center justify-center gap-1 text-xs sm:text-sm">
                      {formatUS(ticket.aging)} {(isCritical || ticket.isMissing) && <AlertTriangle size={14} className={ticket.isMissing ? "text-red-600" : "text-orange-500"} />}
                    </td>
                  </tr>
                );
              })}
              {data.agingTickets.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500">Great! No pending or missing tickets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BẢNG INVENTORY GAP (Đã nâng max-h lên 1000px) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-2">Inventory GAP Table (GAP ≠ 0)</h3>
        {/* CHỈNH SỬA TẠI ĐÂY: max-h-[500px] -> max-h-[1000px] */}
        <div className="overflow-y-auto overflow-x-auto max-h-[1000px] mt-2 relative">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-2 font-medium">Group</th><th className="pb-3 px-2 font-medium">SKU</th><th className="pb-3 px-2 font-medium">Product-Name</th>
                <th className="pb-3 px-2 font-medium text-right">Open</th><th className="pb-3 px-2 font-medium text-right">Process</th><th className="pb-3 px-2 font-medium text-right">Import</th><th className="pb-3 px-2 font-medium text-right">Export</th><th className="pb-3 px-2 font-medium text-right">Sales</th><th className="pb-3 px-2 font-medium text-right">Waste</th><th className="pb-3 px-2 font-medium text-right">Stock</th><th className="pb-3 px-2 font-bold text-right text-gray-800">GAP</th>
              </tr>
            </thead>
            <tbody>
              {data.gapData.map((row:any, idx:number) => (
                <tr key={idx} className="border-b border-gray-100 text-gray-700 hover:bg-gray-50">
                  <td className="py-3 px-2 text-xs sm:text-sm">{row.group}</td><td className="py-3 px-2 text-xs sm:text-sm">{row.sku}</td><td className="py-3 px-2 font-medium truncate max-w-[150px] sm:max-w-[200px]" title={row.name}>{row.name}</td>
                  <td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.open)}</td><td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.process)}</td><td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.import)}</td><td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.export)}</td><td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.sales)}</td><td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.waste)}</td><td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.stock)}</td>
                  <td className={`py-3 px-2 text-right font-bold text-xs sm:text-sm ${row.gap < 0 ? 'text-red-600' : 'text-orange-500'}`}>{formatUS(row.gap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}