import React, { memo } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line, LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// COMPONENT TÙY CHỈNH: Tự động xuống dòng cho trục Y của Cancel Reasons
const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value;
  const maxLen = 22; // Số ký tự tối đa trên 1 dòng
  
  let lines = [text];
  if (text.length > maxLen) {
    const breakPoint = text.lastIndexOf(" ", maxLen);
    if (breakPoint > 0) {
      lines = [text.substring(0, breakPoint), text.substring(breakPoint + 1)];
    } else {
      lines = [text.substring(0, maxLen), text.substring(maxLen)];
    }
    // Nếu dòng 2 vẫn quá dài, cắt bớt dòng 2
    if (lines[1].length > maxLen) {
      lines[1] = lines[1].substring(0, maxLen - 3) + '...';
    }
  }
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text 
          key={i} 
          x={0} 
          y={0} 
          dy={i === 0 ? (lines.length > 1 ? -2 : 4) : 10} 
          textAnchor="end" 
          fill="#666" 
          fontSize={10}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

function OverviewTab({ data, utils }: { data: any, utils: any }) {
  const { formatUS, renderPoP } = utils;
  
  return (
    <>
      {/* 6 THẺ SCORECARD TỔNG QUAN */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenue</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold truncate" title={formatUS(data.revenue)}>{formatUS(data.revenue)}</p>{renderPoP(data.revenue, data.prevStats.revenue, false)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenue after discount</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-blue-600 truncate" title={formatUS(data.revAfterDisc)}>{formatUS(data.revAfterDisc)}</p>{renderPoP(data.revAfterDisc, data.prevStats.revAfterDisc, false)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Commissions</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate" title={formatUS(data.commissions)}>{formatUS(data.commissions)}</p>{renderPoP(data.commissions, data.prevStats.commissions, true)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">VAT</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate" title={formatUS(data.vatValue)}>{formatUS(data.vatValue)}</p>{renderPoP(data.vatValue, data.prevStats.vatValue, true)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Royalty (5%)</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate" title={formatUS(data.royalty)}>{formatUS(data.royalty)}</p>{renderPoP(data.royalty, data.prevStats.royalty, true)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Net revenue</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-green-600 truncate" title={formatUS(data.trueNetRevenue)}>{formatUS(data.trueNetRevenue)}</p>{renderPoP(data.trueNetRevenue, data.prevStats.trueNetRevenue, false)}</div>
          <p className="text-[10px] text-gray-400 mt-1 italic">*Excluding OPEX & COGS</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Count-Bills</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(data.totalBills)}</p>{renderPoP(data.totalBills, data.prevStats.totalBills, false)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">AOV</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(data.aov)}</p>{renderPoP(data.aov, data.prevStats.aov, false)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Discount rate TB</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(data.discountRateTB)}%</p>{renderPoP(data.discountRateTB, data.prevStats.discountRateTB, true)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Waste Qty</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate">{formatUS(data.wasteQty)}</p>{renderPoP(data.wasteQty, data.prevStats.wasteQty, true)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Waste Ratio</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate">{formatUS(data.wasteRatio)}%</p>{renderPoP(data.wasteRatio, data.prevStats.wasteRatio, true)}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Cancel rate</p>
          <div className="flex flex-col mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(data.cancelRate)}%</p>{renderPoP(data.cancelRate, data.prevStats.cancelRate, true)}</div>
        </div>
      </div>

      {/* DAILY REVENUE & PAYMENT METHODS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Revenue</h3>
          <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[300px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(val)} />
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="#eff6ff" name="Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Payment Methods</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
             <div className="h-48 sm:h-64 w-full md:w-1/2 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.paymentData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.paymentData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-1.5 sm:gap-2">
              {data.paymentData.map((p:any, i:number) => (
                <div key={i} className="flex items-center justify-between text-[11px] sm:text-xs xl:text-sm w-full border-b border-gray-50 pb-1.5 last:border-0">
                  <div className="flex items-start flex-1 min-w-0 pr-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2 mt-[3px] shrink-0" style={{ backgroundColor: p.color }}></span>
                    <span className="text-gray-600 break-words leading-tight truncate" title={p.name}>{p.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0 text-right mt-[1px]">{formatUS(p.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DAILY DISCOUNT & DAILY WASTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Discount Rate (%)</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis width={30} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => formatUS(val)} />
                  <Tooltip formatter={(value: any) => `${formatUS(value)}%`} />
                  <Area type="monotone" dataKey="discount" stroke="#ea580c" strokeWidth={3} fill="#fff7ed" name="Discount Rate" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Waste Qty</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                {/* Đã giảm width YAxis xuống 40 và margin left 0 để không bị thụt vô quá sâu */}
                <LineChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => formatUS(val)} />
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                  <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={3} dot={{r:3}} name="Waste Qty" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY CANCEL & CANCEL REASONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Cancel Qty</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                {/* Đã giảm width YAxis xuống 40 và margin left 0 */}
                <LineChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => formatUS(val)} />
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                  <Line type="monotone" dataKey="cancel" stroke="#8b5cf6" strokeWidth={3} dot={{r:3}} name="Cancel Qty" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Cancel Reasons</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cancelReasonData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  {/* Sử dụng component CustomYAxisTick để tự động bẻ 2 dòng thay vì truncate, thu gọn width xuống 130 */}
                  <YAxis dataKey="name" type="category" width={130} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f5f3ff'}} />
                  <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Cancel Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* WASTE BY STORE & WASTE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Waste vs Target by Store</h3>
          <div className="flex-1 w-full relative min-h-[300px]">
            <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
              <div className="h-full min-w-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {/* CẬP NHẬT: Xóa left margin, tăng bottom margin. Giảm width Y về 40. Xoay dọc XAxis */}
                  <ComposedChart data={data.wasteByStoreData} margin={{ top: 20, right: 5, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    {/* angle={-90} xoay đứng chữ, interval={0} ép hiển thị tất cả các mã cửa hàng */}
                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{fontSize: 10, fontWeight: 500, angle: -90, textAnchor: 'end'}} dy={5} />
                    <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => formatUS(val)} />
                    <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#fef2f2'}} />
                    <Bar dataKey="actual" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} name="Actual Waste" />
                    <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} name="Waste Target" />
                    <Line type="monotone" dataKey="avgWaste" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="Average Waste" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Waste Breakdown by Group (%)</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
             <div className="h-48 sm:h-64 w-full md:w-1/2 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.wasteByGroupData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.wasteByGroupData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-1.5 sm:gap-2">
              {data.wasteByGroupData.map((p:any, i:number) => (
                <div key={i} className="flex items-center justify-between text-[11px] sm:text-xs xl:text-sm w-full border-b border-gray-50 pb-1.5 last:border-0">
                  <div className="flex items-start flex-1 min-w-0 pr-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2 mt-[3px] shrink-0" style={{ backgroundColor: p.color }}></span>
                    <span className="text-gray-600 break-words leading-tight truncate" title={p.name}>{p.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0 text-right mt-[1px]">
                    {formatUS(p.value)} <span className="text-gray-400 font-normal ml-1">({data.wasteQty > 0 ? ((p.value / data.wasteQty) * 100).toFixed(1) : 0}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOP TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 Best-Selling Products (By Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium px-2">SKU</th><th className="pb-2 font-medium px-2">Product</th><th className="pb-2 font-medium px-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.topSalesByGroup.map((g:any, gIdx:number) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-blue-50 border-y border-gray-200"><td colSpan={3} className="py-2 px-2 font-bold text-blue-800 uppercase text-xs">Group: {g.group}</td></tr>
                    {g.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        {/* CẬP NHẬT: Xóa truncate, sử dụng whitespace-normal break-words để tự xuống dòng không bị ẩn */}
                        <td className="py-2 px-2 text-xs sm:text-sm">{item.sku}</td>
                        <td className="py-2 px-2 font-medium whitespace-normal break-words min-w-[150px] leading-snug">{item.name}</td>
                        <td className="py-2 px-2 text-right font-semibold text-gray-700 text-xs sm:text-sm">{formatUS(item.qty)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 Waste Products (By Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium px-2">SKU</th><th className="pb-2 font-medium px-2">Product</th><th className="pb-2 font-medium px-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.topWasteByGroup.map((g:any, gIdx:number) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-red-50 border-y border-gray-200"><td colSpan={3} className="py-2 px-2 font-bold text-red-800 uppercase text-xs">Group: {g.group}</td></tr>
                    {g.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-xs sm:text-sm">{item.sku}</td>
                        <td className="py-2 px-2 font-medium whitespace-normal break-words min-w-[150px] leading-snug">{item.name}</td>
                        <td className="py-2 px-2 text-right font-semibold text-gray-700 text-xs sm:text-sm">{formatUS(item.qty)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(OverviewTab);