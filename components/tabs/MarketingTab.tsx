import React, { memo } from 'react';
import { AreaChart, Area, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MarketingTab({ data, utils }: { data: any, utils: any }) {
  const { formatUS, renderPoP } = utils;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Promotion Revenue</p>
          {/* CẬP NHẬT TẠI ĐÂY: Xóa truncate, dùng text-lg sm:text-3xl và break-words */}
          <div className="flex flex-col mt-2"><p className="text-lg sm:text-3xl font-bold text-blue-600 break-words leading-tight">{formatUS(data.promoRev)}</p>{renderPoP(data.promoRev, data.prevStats.promoRev, false)}</div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Discount</p>
          <div className="flex flex-col mt-2"><p className="text-lg sm:text-3xl font-bold text-orange-500 break-words leading-tight">{formatUS(data.promoDisc)}</p>{renderPoP(data.promoDisc, data.prevStats.promoDisc, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Promotion Qty</p>
          <div className="flex flex-col mt-2"><p className="text-lg sm:text-3xl font-bold text-gray-800 break-words leading-tight">{formatUS(data.promoQty)}</p>{renderPoP(data.promoQty, data.prevStats.promoQty, false)}</div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Promo / Total Revenue (%)</p>
          <div className="flex flex-col mt-2">
            <p className="text-lg sm:text-3xl font-bold text-gray-800 break-words leading-tight">
              {data.revAfterDisc > 0 ? formatUS((data.promoRev / data.revAfterDisc) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full mb-6">
        <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Revenue vs Promotion Revenue (Daily)</h3>
        <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[350px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(val)} />
                <Tooltip formatter={(value: any) => formatUS(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="#eff6ff" name="Total Revenue" />
                <Area type="monotone" dataKey="promoRevenue" stroke="#10b981" strokeWidth={2} fill="#d1fae5" name="Promo Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Top 10 Promotions by Qty</h3>
          <div className="flex-1 w-full relative min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topPromoByQty} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Top 10 Promotions by Revenue</h3>
          <div className="flex-1 w-full relative min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topPromoByRev} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="gross" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-2">Promotion Details Table</h3>
        <div className="overflow-x-auto max-h-none mt-2 relative">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-2 font-medium">Promotion Name (Type-Info)</th>
                <th className="pb-3 px-2 font-medium text-right">Qty</th>
                <th className="pb-3 px-2 font-medium text-right">Sales</th>
                <th className="pb-3 px-2 font-medium text-right">Discount</th>
                <th className="pb-3 px-2 font-bold text-right text-gray-800">Gross Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.promoList.map((row:any, idx:number) => (
                <tr key={idx} className="border-b border-gray-100 text-gray-700 hover:bg-gray-50">
                  {/* CẬP NHẬT TẠI ĐÂY: Xóa truncate, dùng whitespace-normal break-words min-w-[260px] */}
                  <td className="py-3 px-2 font-medium text-xs sm:text-sm whitespace-normal break-words min-w-[260px] sm:min-w-[300px] leading-snug">{row.name}</td>
                  <td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.qty)}</td>
                  <td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.sales)}</td>
                  <td className="py-3 px-2 text-right text-xs sm:text-sm text-orange-500">{formatUS(row.discount)}</td>
                  <td className="py-3 px-2 text-right font-bold text-xs sm:text-sm text-blue-600">{formatUS(row.gross)}</td>
                </tr>
              ))}
              {data.promoList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">No promotion data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default memo(MarketingTab);