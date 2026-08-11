"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardClient({ fileNames }: { fileNames: string[] }) {
  // STATE DATA
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE SLICERS
  const [storeFilter, setStoreFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // LẤY VÀ PHÂN TÍCH DỮ LIỆU TỪ PUBLIC/DATA
  useEffect(() => {
    async function loadData() {
      let allData: any[] = [];
      try {
        for (const file of fileNames) {
          // Trình duyệt tự động fetch file tĩnh
          const response = await fetch(`/data/${file}`);
          const text = await response.text();
          
          const parsed = Papa.parse(text, {
            header: true,
            delimiter: '|',
            skipEmptyLines: true,
          });
          allData = [...allData, ...parsed.data];
        }
        setRawData(allData);
      } catch (error) {
        console.error("Lỗi khi tải file data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (fileNames.length > 0) loadData();
    else setIsLoading(false);
  }, [fileNames]);

  // HÀM PHỤ TRỢ FORMAT
  const parseNum = (val: any) => parseFloat(val) || 0;
  const formatUS = (val: any) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseNum(val));
  };
  const parseDataDate = (dateStr: string) => {
    if (!dateStr) return null;
    const months: any = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2], 10) + 2000, months[parts[1]], parseInt(parts[0], 10)).getTime();
  };
  const parseInputDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getTime();
  };

  // DROPDOWN OPTIONS
  const stores = useMemo(() => Array.from(new Set(rawData.map(d => d['Store-Name']).filter(Boolean))), [rawData]);
  const groups = useMemo(() => Array.from(new Set(rawData.map(d => d['Group']).filter(Boolean))), [rawData]);

  // LỌC DỮ LIỆU TƯƠNG TÁC
  const filteredData = useMemo(() => {
    const startTime = parseInputDate(startDate);
    const endTime = parseInputDate(endDate);

    return rawData.filter(row => {
      if (storeFilter !== 'All' && row['Store-Name'] !== storeFilter) return false;
      if (groupFilter !== 'All' && row['Group'] !== groupFilter) return false;
      
      if (startTime || endTime) {
        const rowTime = parseDataDate(row['Date']);
        if (!rowTime) return false;
        if (startTime && rowTime < startTime) return false;
        if (endTime && rowTime > endTime) return false;
      }
      return true;
    });
  }, [rawData, storeFilter, groupFilter, startDate, endDate]);

  // XỬ LÝ SỐ LIỆU ĐỂ RENDER
  const { netRevenue, totalBills, aov, discountRateTB, wasteQty, cancelRate, trendData, paymentData, topSalesByGroup, topWasteByGroup, agingTickets, pendingStats, gapData } = useMemo(() => {
    let rev = 0, totalDiscount = 0, countBills = 0, cancelBills = 0, waste = 0;
    const trendMap: Record<string, any> = {};
    const paymentMap: Record<string, number> = {};
    const gapMap: Record<string, any> = {};
    const tickets: any[] = [];
    const pStats = { buying: 0, process: 0, export: 0, import: 0 };
    const salesMapByGroup: Record<string, Record<string, any>> = {};
    const wasteMapByGroup: Record<string, Record<string, any>> = {};

    const today = new Date('2026-08-09').getTime();

    filteredData.forEach(row => {
      const type = row['Ticket-Type'];
      const qty = parseNum(row['Qty']);
      const dateStr = row['Date'];
      const day = dateStr ? dateStr.split('-')[0] : 'N/A';
      const groupName = row['Group'] || 'Khác';

      if (!trendMap[day]) trendMap[day] = { day, revenue: 0, target: 0, discountAmt: 0, waste: 0, countBill: 0, cancel: 0 };

      if (type === 'Sales') {
        const gross = parseNum(row['Gross-Sales']);
        const disc = parseNum(row['Discount']);
        rev += gross;
        totalDiscount += disc;
        trendMap[day].revenue += gross;
        trendMap[day].discountAmt += disc;

        const sku = row['SKU'];
        if (sku) {
          if (!salesMapByGroup[groupName]) salesMapByGroup[groupName] = {};
          salesMapByGroup[groupName][sku] = salesMapByGroup[groupName][sku] || { sku, name: row['Product-Name'], qty: 0 };
          salesMapByGroup[groupName][sku].qty += qty;
        }
      }
      if (type === 'Count-Bills') { countBills += qty; trendMap[day].countBill += qty; }
      if (type === 'Cancel') { cancelBills += qty; trendMap[day].cancel += qty; }
      if (type === 'Waste') {
        waste += qty; trendMap[day].waste += qty;
        const sku = row['SKU'];
        if (sku) {
          if (!wasteMapByGroup[groupName]) wasteMapByGroup[groupName] = {};
          wasteMapByGroup[groupName][sku] = wasteMapByGroup[groupName][sku] || { sku, name: row['Product-Name'], qty: 0 };
          wasteMapByGroup[groupName][sku].qty += qty;
        }
      }
      if (type === 'Target') trendMap[day].target += parseNum(row['Sales']);
      if (type === 'Payment') {
        const pType = row['Type-Info'];
        paymentMap[pType] = (paymentMap[pType] || 0) + parseNum(row['Sales']);
      }
      if (['Ticket', 'Process', 'Import', 'Export'].includes(type)) { 
        const typeInfo = row['Type-Info'];
        if (typeInfo === 'Buying-Ticket') pStats.buying += qty;
        if (typeInfo === 'Process-Ticket') pStats.process += qty;
        if (typeInfo === 'Export-Ticket') pStats.export += qty;
        if (typeInfo === 'Import-Ticket') pStats.import += qty;

        if (['Buying-Ticket', 'Process-Ticket', 'Export-Ticket', 'Import-Ticket'].includes(typeInfo)) {
          const tDate = parseDataDate(dateStr) || today;
          const agingDays = Math.floor((today - tDate) / (1000 * 3600 * 24)) || 1;
          tickets.push({ date: dateStr, type: typeInfo, qty, aging: agingDays > 0 ? agingDays : 1 });
        }
      }

      const sku = row['SKU'];
      if (sku) {
        const key = `${groupName}_${sku}`;
        if (!gapMap[key]) gapMap[key] = { group: groupName, sku, name: row['Product-Name'], open:0, process:0, import:0, export:0, sales:0, waste:0, stock:0, gap:0 };
        if (type === 'Open') gapMap[key].open += qty;
        if (type === 'Process') gapMap[key].process += qty;
        if (type === 'Import') gapMap[key].import += qty;
        if (type === 'Export') gapMap[key].export += qty;
        if (type === 'Sales') gapMap[key].sales += qty;
        if (type === 'Waste') gapMap[key].waste += qty;
        if (type === 'Stock') gapMap[key].stock += qty;
      }
    });

    const tData = Object.values(trendMap).map(d => ({ ...d, discount: d.revenue > 0 ? (d.discountAmt / d.revenue) * 100 : 0 })).sort((a, b) => parseInt(a.day) - parseInt(b.day));
    const pColors = ['#2563eb', '#f97316', '#10b981', '#fbbf24', '#8b5cf6', '#ec4899'];
    const pData = Object.keys(paymentMap).map((k, i) => ({ name: k, value: paymentMap[k], color: pColors[i % pColors.length] }));
    const tSalesGroup = Object.keys(salesMapByGroup).map(group => ({ group, items: Object.values(salesMapByGroup[group]).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) })).filter(g => g.items.length > 0);
    const tWasteGroup = Object.keys(wasteMapByGroup).map(group => ({ group, items: Object.values(wasteMapByGroup[group]).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) })).filter(g => g.items.length > 0);
    const gData = Object.values(gapMap).map(r => { r.gap = (r.open + r.process + r.import) - (r.export + r.sales + r.waste + r.stock); return r; }).filter(r => r.gap !== 0);

    return {
      netRevenue: rev, totalBills: countBills, aov: countBills > 0 ? rev / countBills : 0, discountRateTB: rev > 0 ? (totalDiscount / rev) * 100 : 0,
      wasteQty: waste, cancelRate: countBills > 0 ? (cancelBills / countBills) * 100 : 0,
      trendData: tData, paymentData: pData, topSalesByGroup: tSalesGroup, topWasteByGroup: tWasteGroup, agingTickets: tickets, pendingStats: pStats, gapData: gData
    };
  }, [filteredData]);

  // GIAO DIỆN TRẠNG THÁI LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-medium text-lg">Đang đọc dữ liệu vận hành...</p>
      </div>
    );
  }

  // GIAO DIỆN CHÍNH
  return (
    <div className="p-3 sm:p-6 bg-[#f8f9fa] min-h-screen font-sans text-gray-800">
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-50">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Operations Dashboard</h1>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm bg-white cursor-pointer hover:border-blue-500 w-full md:w-auto">
            <option value="All">-- Tất cả Cửa hàng --</option>
            {stores.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex flex-row items-center justify-between space-x-2 border border-gray-300 rounded-md bg-white p-1 w-full md:w-auto overflow-hidden">
            <span className="text-sm text-gray-500 pl-2 hidden sm:inline">Từ:</span>
            <input type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} className="p-1 text-sm outline-none bg-transparent text-gray-700 cursor-pointer w-full"/>
            <span className="text-sm text-gray-400">→</span>
            <span className="text-sm text-gray-500 hidden sm:inline">Đến:</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className="p-1 text-sm outline-none bg-transparent text-gray-700 cursor-pointer w-full pr-2"/>
          </div>
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm bg-white cursor-pointer hover:border-blue-500 w-full md:w-auto">
            <option value="All">-- Tất cả Nhóm --</option>
            {groups.map((g: any) => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="md:ml-auto flex items-center justify-center text-sm text-gray-500 font-medium bg-blue-50 text-blue-600 px-3 py-2 rounded-md w-full md:w-auto">
            Đang lọc: {formatUS(filteredData.length)} records
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Net revenue</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate" title={formatUS(netRevenue)}>{formatUS(netRevenue)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Count-Bills</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(totalBills)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">AOV</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(aov)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Discount rate TB</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(discountRateTB)}%</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Waste Qty</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600 truncate">{formatUS(wasteQty)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Cancel rate</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(cancelRate)}%</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Doanh thu theo ngày</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis width={40} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => new Intl.NumberFormat('en-US', {notation: 'compact'}).format(val)} />
                <Tooltip formatter={(value: any) => formatUS(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="#eff6ff" name="Doanh thu" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Cơ cấu thanh toán</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4">
             <div className="h-48 sm:h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-2 grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-0">
              {paymentData.map((p, i) => (
                <div key={i} className="flex items-center text-xs sm:text-sm w-full overflow-hidden">
                  <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: p.color }}></span>
                  <span className="text-gray-600 truncate" title={p.name}>{p.name}: <span className="font-bold">{formatUS(p.value)}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Discount rate theo ngày (%)</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis width={30} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => formatUS(val)} />
                <Tooltip formatter={(value: any) => `${formatUS(value)}%`} />
                <Area type="monotone" dataKey="discount" stroke="#ea580c" strokeWidth={3} fill="#fff7ed" name="Discount Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Waste Qty theo ngày</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis width={30} axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => formatUS(val)} />
                <Tooltip formatter={(value: any) => formatUS(value)} />
                <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={3} dot={{r:3}} name="Waste Qty" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 SP bán chạy (Theo Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[350px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white">
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium px-1">SKU</th><th className="pb-2 font-medium px-1">Sản phẩm</th><th className="pb-2 font-medium px-1 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {topSalesByGroup.map((g, gIdx) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-blue-50 border-y border-gray-200"><td colSpan={3} className="py-2 px-2 font-bold text-blue-800 uppercase text-xs">Group: {g.group}</td></tr>
                    {g.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-xs sm:text-sm">{item.sku}</td><td className="py-2 px-1 font-medium truncate max-w-[150px] sm:max-w-[200px]" title={item.name}>{item.name}</td><td className="py-2 px-2 text-right font-semibold text-gray-700 text-xs sm:text-sm">{formatUS(item.qty)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 SP hao hụt (Theo Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[350px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white">
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium px-1">SKU</th><th className="pb-2 font-medium px-1">Sản phẩm</th><th className="pb-2 font-medium px-1 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {topWasteByGroup.map((g, gIdx) => (
                  <React.Fragment key={gIdx}>
                    <tr className="bg-red-50 border-y border-gray-200"><td colSpan={3} className="py-2 px-2 font-bold text-red-800 uppercase text-xs">Group: {g.group}</td></tr>
                    {g.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-xs sm:text-sm">{item.sku}</td><td className="py-2 px-1 font-medium truncate max-w-[150px] sm:max-w-[200px]" title={item.name}>{item.name}</td><td className="py-2 px-2 text-right font-semibold text-gray-700 text-xs sm:text-sm">{formatUS(item.qty)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4">Đối soát vận hành — Phiếu treo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Buying-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.buying)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Process-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.process)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Export-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.export)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Import-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.import)}</p></div>
        </div>
        <div className="overflow-y-auto overflow-x-auto max-h-[300px]">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-2 font-medium">Ngày</th><th className="pb-3 px-2 font-medium">Loại phiếu</th><th className="pb-3 px-2 font-medium text-center">Qty</th><th className="pb-3 px-2 font-medium text-center">Số ngày treo</th>
              </tr>
            </thead>
            <tbody>
              {agingTickets.map((ticket, idx) => {
                const isCritical = ticket.aging > 5;
                return (
                  <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${isCritical ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'}`}>
                    <td className="py-2 px-2 text-xs sm:text-sm">{ticket.date}</td><td className="py-2 px-2 text-xs sm:text-sm">{ticket.type}</td><td className="py-2 px-2 text-center text-xs sm:text-sm">{formatUS(ticket.qty)}</td>
                    <td className="py-2 px-2 text-center flex items-center justify-center gap-1 text-xs sm:text-sm">{formatUS(ticket.aging)} {isCritical && <AlertTriangle size={14} className="text-red-500" />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-2">Bảng GAP tồn kho (GAP ≠ 0)</h3>
        <div className="overflow-y-auto overflow-x-auto max-h-[500px] mt-2 relative">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-2 font-medium">Group</th><th className="pb-3 px-2 font-medium">SKU</th><th className="pb-3 px-2 font-medium">Product-Name</th>
                <th className="pb-3 px-2 font-medium text-right">Open</th><th className="pb-3 px-2 font-medium text-right">Process</th><th className="pb-3 px-2 font-medium text-right">Import</th><th className="pb-3 px-2 font-medium text-right">Export</th><th className="pb-3 px-2 font-medium text-right">Sales</th><th className="pb-3 px-2 font-medium text-right">Waste</th><th className="pb-3 px-2 font-medium text-right">Stock</th><th className="pb-3 px-2 font-bold text-right text-gray-800">GAP</th>
              </tr>
            </thead>
            <tbody>
              {gapData.map((row, idx) => (
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

    </div>
  );
}