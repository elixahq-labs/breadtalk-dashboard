import React, { memo } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line, LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const text = payload.value;
  const maxLen = 22; 
  
  let lines = [text];
  if (text.length > maxLen) {
    const breakPoint = text.lastIndexOf(" ", maxLen);
    if (breakPoint > 0) {
      lines = [text.substring(0, breakPoint), text.substring(breakPoint + 1)];
    } else {
      lines = [text.substring(0, maxLen), text.substring(maxLen)];
    }
    if (lines[1].length > maxLen) {
      lines[1] = lines[1].substring(0, maxLen - 3) + '...';
    }
  }
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text key={i} x={0} y={0} dy={i === 0 ? (lines.length > 1 ? -2 : 4) : 10} textAnchor="end" fill="#a3aed1" fontSize={10}>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6 mb-8">
        
        {/* HIGHLIGHTED CARD THEO UI MỚI */}
        <div className="bg-[#2b3674] p-4 sm:p-6 rounded-3xl shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-[11px] sm:text-sm text-blue-200 font-semibold mb-1 sm:mb-2">Total Revenue</p>
            <div className="flex flex-col">
              <p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-white whitespace-nowrap tracking-tighter">{formatUS(data.revenue)}</p>
              {renderPoP(data.revenue, data.prevStats.revenue, false, true)}
            </div>
          </div>
        </div>

        {/* CÁC CARD CÒN LẠI DÙNG UI SÁNG */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Revenue after disc.</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-[#2b3674] whitespace-nowrap tracking-tighter">{formatUS(data.revAfterDisc)}</p>{renderPoP(data.revAfterDisc, data.prevStats.revAfterDisc, false)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Commissions</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap tracking-tighter">{formatUS(data.commissions)}</p>{renderPoP(data.commissions, data.prevStats.commissions, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">VAT</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap tracking-tighter">{formatUS(data.vatValue)}</p>{renderPoP(data.vatValue, data.prevStats.vatValue, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Royalty (5%)</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap tracking-tighter">{formatUS(data.royalty)}</p>{renderPoP(data.royalty, data.prevStats.royalty, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Net revenue</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-[#00d084] whitespace-nowrap tracking-tighter">{formatUS(data.trueNetRevenue)}</p>{renderPoP(data.trueNetRevenue, data.prevStats.trueNetRevenue, false)}</div>
          <p className="text-[9px] text-slate-400 mt-1 italic">*Excl. OPEX & COGS</p>
        </div>

        {/* HÀNG CARD THỨ 2 */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Total Bills</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-[#2b3674] whitespace-nowrap tracking-tighter">{formatUS(data.totalBills)}</p>{renderPoP(data.totalBills, data.prevStats.totalBills, false)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">AOV</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-[#2b3674] whitespace-nowrap tracking-tighter">{formatUS(data.aov)}</p>{renderPoP(data.aov, data.prevStats.aov, false)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Discount rate</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-[#2b3674] whitespace-nowrap tracking-tighter">{formatUS(data.discountRateTB)}%</p>{renderPoP(data.discountRateTB, data.prevStats.discountRateTB, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Waste Qty</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-red-500 whitespace-nowrap tracking-tighter">{formatUS(data.wasteQty)}</p>{renderPoP(data.wasteQty, data.prevStats.wasteQty, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Waste Ratio</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-red-500 whitespace-nowrap tracking-tighter">{formatUS(data.wasteRatio)}%</p>{renderPoP(data.wasteRatio, data.prevStats.wasteRatio, true)}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mb-1 sm:mb-2">Cancel rate</p>
          <div className="flex flex-col"><p className="text-[13px] min-[375px]:text-[15px] sm:text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap tracking-tighter">{formatUS(data.cancelRate)}%</p>{renderPoP(data.cancelRate, data.prevStats.cancelRate, true)}</div>
        </div>
      </div>

      {/* BIỂU ĐỒ DAILY REVENUE VÀ PAYMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Daily Revenue</h3>
          <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[300px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.trendData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} />
                  <YAxis width={45} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} tickFormatter={(val) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(val)} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                  <Area type="monotone" dataKey="revenue" stroke="#4318FF" strokeWidth={3} fillOpacity={0.1} fill="#4318FF" name="Revenue" />
                  <Line type="monotone" dataKey="target" stroke="#F15A2B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Payment Methods</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
             <div className="h-48 sm:h-64 w-full md:w-1/2 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.paymentData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.paymentData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-2">
              {data.paymentData.map((p:any, i:number) => (
                <div key={i} className="flex flex-col w-full border-b border-slate-50 pb-2 last:border-0">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs xl:text-sm">
                    <div className="flex items-center flex-1 min-w-0 pr-2">
                      <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: p.color }}></span>
                      <span className="text-slate-500 font-medium whitespace-nowrap text-ellipsis overflow-hidden" title={p.name}>{p.name}</span>
                      {/* Bổ sung % tỷ trọng bên cạnh tên */}
                      <span className="text-slate-400 font-normal ml-1">({p.percent.toFixed(1)}%)</span>
                    </div>
                    <span className="font-bold text-[#2b3674] shrink-0 text-right">{formatUS(p.value)}</span>
                  </div>
                  {/* CẬP NHẬT: Thêm PoP Indicator phía dưới */}
                  <div className="flex justify-end mt-0.5">
                    {renderPoP(p.value, p.prevValue, false)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ DISCOUNT VÀ WASTE CÓ ĐƯỜNG SO SÁNH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Daily Discount Rate (%)</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} />
                  <YAxis width={35} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} tickFormatter={(val) => formatUS(val)} />
                  <Tooltip formatter={(value: any) => `${formatUS(value)}%`} cursor={{fill: '#f8fafc'}} />
                  <Area type="monotone" dataKey="discount" stroke="#FFB703" strokeWidth={3} fillOpacity={0.1} fill="#FFB703" name="Discount Rate" />
                  {/* CẬP NHẬT: Thêm đường nét đứt của Discount chu kỳ trước */}
                  <Line type="monotone" dataKey="prevDiscount" stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Prev Discount" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Daily Waste Qty</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} />
                  <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} tickFormatter={(val) => formatUS(val)} />
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                  <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={3} dot={{r:3, fill: '#ef4444'}} name="Waste Qty" />
                  {/* CẬP NHẬT: Thêm đường nét đứt của Waste chu kỳ trước */}
                  <Line type="monotone" dataKey="prevWaste" stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Prev Waste" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ CANCEL VÀ REASONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Daily Cancel Qty</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} />
                  <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} tickFormatter={(val) => formatUS(val)} />
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                  <Line type="monotone" dataKey="cancel" stroke="#8b5cf6" strokeWidth={3} dot={{r:3, fill: '#8b5cf6'}} name="Cancel Qty" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Cancel Reasons</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.cancelReasonData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={130} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} name="Cancel Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ KẾT HỢP WASTE VS TARGET VÀ WASTE BREAKDOWN CÓ PoP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Waste vs Target by Store</h3>
          <div className="flex-1 w-full relative min-h-[300px]">
            <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
              <div className="h-full min-w-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.wasteByStoreData} margin={{ top: 20, right: 5, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{fontSize: 10, fontWeight: 500, fill: '#a3aed1', angle: -90, textAnchor: 'end'}} dy={5} />
                    <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a3aed1'}} tickFormatter={(val) => formatUS(val)} />
                    <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="actual" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Actual Waste" />
                    <Line type="monotone" dataKey="target" stroke="#F15A2B" strokeWidth={3} dot={{r: 4}} name="Waste Target" />
                    <Line type="monotone" dataKey="avgWaste" stroke="#4318FF" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Average Waste" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Waste Breakdown by Group (%)</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
             <div className="h-48 sm:h-64 w-full md:w-1/2 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.wasteByGroupData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.wasteByGroupData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-2">
              {data.wasteByGroupData.map((p:any, i:number) => (
                <div key={i} className="flex flex-col w-full border-b border-slate-50 pb-2 last:border-0">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs xl:text-sm">
                    <div className="flex items-center flex-1 min-w-0 pr-2">
                      <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: p.color }}></span>
                      <span className="text-slate-500 font-medium whitespace-nowrap text-ellipsis overflow-hidden" title={p.name}>{p.name}</span>
                      <span className="text-slate-400 font-normal ml-1">({data.wasteQty > 0 ? ((p.value / data.wasteQty) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <span className="font-bold text-[#2b3674] shrink-0 text-right">{formatUS(p.value)}</span>
                  </div>
                  {/* CẬP NHẬT: Thêm PoP Indicator (True color vì waste tăng là xấu) */}
                  <div className="flex justify-end mt-0.5">
                    {renderPoP(p.value, p.prevValue, true)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOP TABLES SẢN PHẨM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674]">Top 5 Best-Selling Products (By Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-semibold px-2">SKU</th>
                  <th className="pb-3 font-semibold px-2">Product</th>
                  <th className="pb-3 font-semibold px-2 text-right">Qty (n-1)</th>
                  <th className="pb-3 font-semibold px-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.topSalesByGroup.map((g:any, gIdx:number) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-slate-50 border-y border-slate-100"><td colSpan={4} className="py-2 px-3 font-bold text-[#2b3674] uppercase text-xs rounded-lg mt-2 inline-block">Group: {g.group}</td></tr>
                    {g.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 text-xs sm:text-sm text-slate-500 font-medium">{item.sku}</td>
                        <td className="py-3 px-2 font-semibold text-slate-800 whitespace-normal break-words min-w-[150px] leading-snug">{item.name}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-400 text-xs sm:text-sm">{formatUS(item.prevQty)}</td>
                        <td className="py-3 px-2 text-right font-bold text-[#4318FF] text-xs sm:text-sm">{formatUS(item.qty)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674]">Top 5 Waste Products (By Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-semibold px-2">SKU</th>
                  <th className="pb-3 font-semibold px-2">Product</th>
                  <th className="pb-3 font-semibold px-2 text-right">Qty (n-1)</th>
                  <th className="pb-3 font-semibold px-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.topWasteByGroup.map((g:any, gIdx:number) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-slate-50 border-y border-slate-100"><td colSpan={4} className="py-2 px-3 font-bold text-[#2b3674] uppercase text-xs rounded-lg mt-2 inline-block">Group: {g.group}</td></tr>
                    {g.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-2 text-xs sm:text-sm text-slate-500 font-medium">{item.sku}</td>
                        <td className="py-3 px-2 font-semibold text-slate-800 whitespace-normal break-words min-w-[150px] leading-snug">{item.name}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-400 text-xs sm:text-sm">{formatUS(item.prevQty)}</td>
                        <td className="py-3 px-2 text-right font-bold text-red-500 text-xs sm:text-sm">{formatUS(item.qty)}</td>
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