import React, { memo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';

function MarketingTab({ data, utils }: { data: any, utils: any }) {
  const { formatUS, renderPoP } = utils;
  
  // Quản lý trạng thái đóng/mở của các dòng Promotion
  const [expandedPromos, setExpandedPromos] = useState<Record<string, boolean>>({});

  const togglePromo = (name: string) => {
    setExpandedPromos(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-[#2b3674] p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <p className="text-xs sm:text-sm text-blue-200 font-semibold">Promotion Revenue</p>
          <div className="flex flex-col mt-2"><p className="text-lg sm:text-3xl font-bold text-white break-words leading-tight">{formatUS(data.promoRev)}</p>{renderPoP(data.promoRev, data.prevStats.promoRev, false, true)}</div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Total Discount</p>
          <div className="flex flex-col mt-2"><p className="text-lg sm:text-3xl font-bold text-orange-500 break-words leading-tight">{formatUS(data.promoDisc)}</p>{renderPoP(data.promoDisc, data.prevStats.promoDisc, true)}</div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Promotion Qty</p>
          <div className="flex flex-col mt-2"><p className="text-lg sm:text-3xl font-bold text-slate-800 break-words leading-tight">{formatUS(data.promoQty)}</p>{renderPoP(data.promoQty, data.prevStats.promoQty, false)}</div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Promo / Total Revenue (%)</p>
          <div className="flex flex-col mt-2">
            <p className="text-lg sm:text-3xl font-bold text-[#4318FF] break-words leading-tight">
              {data.revAfterDisc > 0 ? formatUS((data.promoRev / data.revAfterDisc) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full mb-6">
        <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Revenue vs Promotion Revenue (Daily)</h3>
        <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[350px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} />
                <YAxis width={45} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} tickFormatter={(val) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(val)} />
                <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                <Area type="monotone" dataKey="revenue" stroke="#4318FF" strokeWidth={3} fillOpacity={0.1} fill="#4318FF" name="Total Revenue" />
                <Area type="monotone" dataKey="promoRevenue" stroke="#00d084" strokeWidth={3} fillOpacity={0.2} fill="#00d084" name="Promo Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Top 10 Promotions by Qty</h3>
          <div className="flex-1 w-full relative min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topPromoByQty} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="qty" fill="#4318FF" radius={[0, 8, 8, 0]} barSize={20} name="Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Top 10 Promotions by Revenue</h3>
          <div className="flex-1 w-full relative min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topPromoByRev} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="gross" fill="#00d084" radius={[0, 8, 8, 0]} barSize={20} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4 text-[#2b3674]">Promotion Details Table</h3>
        <div className="overflow-x-auto max-h-none relative">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-3 px-3 font-semibold">Promotion Name (Type-Info)</th>
                <th className="pb-3 px-3 font-semibold text-right">Qty</th>
                <th className="pb-3 px-3 font-semibold text-right">Sales</th>
                <th className="pb-3 px-3 font-semibold text-right">Discount</th>
                <th className="pb-3 px-3 font-bold text-right text-slate-800">Gross Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.promoList.map((row:any, idx:number) => {
                const isExpanded = expandedPromos[row.name];
                const hasStores = row.stores && row.stores.length > 0;
                
                return (
                  <React.Fragment key={idx}>
                    {/* DÒNG TỔNG CỦA PROMOTION */}
                    <tr 
                      onClick={() => { if (hasStores) togglePromo(row.name); }}
                      className={`border-b border-slate-100 text-slate-700 transition-colors ${hasStores ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                    >
                      <td className="py-4 px-3 font-semibold text-slate-800 whitespace-normal break-words min-w-[260px] sm:min-w-[350px] leading-snug flex items-start sm:items-center gap-2">
                        {hasStores && (
                          <div className="mt-0.5 sm:mt-0">
                            {isExpanded ? <ChevronDown size={16} className="text-[#4318FF] shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                          </div>
                        )}
                        {!hasStores && <div className="w-4"></div>}
                        {row.name}
                      </td>
                      <td className="py-4 px-3 text-right text-xs sm:text-sm font-medium">{formatUS(row.qty)}</td>
                      <td className="py-4 px-3 text-right text-xs sm:text-sm font-medium">{formatUS(row.sales)}</td>
                      <td className="py-4 px-3 text-right text-xs sm:text-sm font-bold text-orange-500">{formatUS(row.discount)}</td>
                      <td className="py-4 px-3 text-right font-black text-sm sm:text-base text-[#4318FF]">{formatUS(row.gross)}</td>
                    </tr>

                    {/* DÒNG CHI TIẾT TỪNG CỬA HÀNG (Hiển thị khi được bấm mở ra) */}
                    {isExpanded && hasStores && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="p-0 border-b border-slate-200">
                          <div className="pl-6 sm:pl-10 pr-4 py-3 bg-[#f4f7fe] border-l-4 border-[#4318FF] shadow-inner">
                             <table className="w-full text-xs sm:text-sm text-left">
                               <thead>
                                 <tr className="text-slate-400 border-b border-slate-200">
                                   <th className="pb-2 px-2 font-medium">Store Breakdown</th>
                                   <th className="pb-2 px-2 font-medium text-right">Qty</th>
                                   <th className="pb-2 px-2 font-medium text-right">Sales</th>
                                   <th className="pb-2 px-2 font-medium text-right">Discount</th>
                                   <th className="pb-2 px-2 font-medium text-right text-[#2b3674]">Gross Sales</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {row.stores.map((s:any, sIdx:number) => (
                                   <tr key={sIdx} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                      <td className="py-2 px-2 text-slate-600 font-semibold">{s.name}</td>
                                      <td className="py-2 px-2 text-right text-slate-500">{formatUS(s.qty)}</td>
                                      <td className="py-2 px-2 text-right text-slate-500">{formatUS(s.sales)}</td>
                                      <td className="py-2 px-2 text-right text-orange-400 font-medium">{formatUS(s.discount)}</td>
                                      <td className="py-2 px-2 text-right font-bold text-[#2b3674]">{formatUS(s.gross)}</td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {data.promoList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-slate-400 font-medium">No promotion data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default memo(MarketingTab);