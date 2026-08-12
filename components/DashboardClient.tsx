"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DashboardClient({ fileNames }: { fileNames: string[] }) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [storeFilter, setStoreFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // TẢI DATA TỪ TỆP TĨNH
  useEffect(() => {
    async function loadData() {
      let allData: any[] = [];
      try {
        for (const file of fileNames) {
          const response = await fetch(`/data/${file}`);
          const text = await response.text();
          const parsed = Papa.parse(text, { header: true, delimiter: '|', skipEmptyLines: true });
          allData = [...allData, ...parsed.data];
        }
        setRawData(allData);
      } catch (error) {
        console.error("Lỗi tải data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (fileNames.length > 0) loadData(); else setIsLoading(false);
  }, [fileNames]);

  // HÀM PHỤ TRỢ (Dọn sạch khoảng trắng)
  const clean = (val: any) => (val || '').toString().trim();
  const parseNum = (val: any) => parseFloat(clean(val).replace(/,/g, '')) || 0;
  const formatUS = (val: any) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseNum(val));
  
  const parseDataDate = (dateStr: string) => {
    const cleaned = clean(dateStr);
    if (!cleaned) return null;
    const months: any = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    const parts = cleaned.split('-');
    if (parts.length !== 3) return null;
    let y = parseInt(parts[2], 10);
    if (y < 100) y += 2000;
    return new Date(y, months[parts[1]], parseInt(parts[0], 10)).getTime();
  };
  
  const parseInputDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getTime();
  };

  // DROPDOWN OPTIONS
  const stores = useMemo(() => Array.from(new Set(rawData.map(d => clean(d['Store-Name'])).filter(Boolean))), [rawData]);
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(rawData.map(d => clean(d['Group'])).filter(Boolean)));
    return uniqueGroups.sort((a: string, b: string) => a.localeCompare(b));
  }, [rawData]);

  // XỬ LÝ LÕI DỮ LIỆU
  const { netRevenue, totalBills, aov, discountRateTB, wasteQty, cancelRate, trendData, paymentData, topSalesByGroup, topWasteByGroup, agingTickets, pendingStats, gapData, filteredCount } = useMemo(() => {
    let rev = 0, totalDiscount = 0, countBills = 0, cancelBills = 0, waste = 0;
    const trendMap: Record<string, any> = {};
    const paymentMap: Record<string, number> = {};
    const gapMap: Record<string, any> = {};
    
    const ticketAgg: Record<string, any> = {};
    // Thêm missingStock vào bộ đếm
    const pStats = { buying: 0, process: 0, import: 0, missingWaste: 0, missingStock: 0 };
    
    // Theo dõi song song cả Waste-Ticket và Stock-Ticket
    const wasteTrackMap: Record<string, Record<string, boolean>> = {};
    const stockTrackMap: Record<string, Record<string, boolean>> = {};
    const activeDates = new Set<string>();
    const activeStores = new Set<string>();

    const salesMapByGroup: Record<string, Record<string, any>> = {};
    const wasteMapByGroup: Record<string, Record<string, any>> = {};
    let fCount = 0;
    const today = new Date('2026-08-12').getTime(); 

    // Xác định Time Bounds
    let minTime = Infinity, maxTime = -Infinity;
    rawData.forEach(r => {
        const t = parseDataDate(r['Date']);
        if (t) { if (t < minTime) minTime = t; if (t > maxTime) maxTime = t; }
    });
    const startTime = parseInputDate(startDate) || minTime;
    const endTime = parseInputDate(endDate) || maxTime;
    const openTime = startTime - 86400000; // Chính xác lùi 1 ngày

    rawData.forEach(row => {
      const store = clean(row['Store-Name']);
      const groupName = clean(row['Group']) || 'Khác';
      const sku = clean(row['SKU']);
      const name = clean(row['Product-Name']);
      const tType = clean(row['Ticket-Type']);
      const tInfo = clean(row['Type-Info']);
      const dateStr = clean(row['Date']);
      const rowTime = parseDataDate(dateStr);
      
      const qty = parseNum(row['Qty']);
      const gross = parseNum(row['Gross-Sales']);
      const disc = parseNum(row['Discount']);
      const salesVal = parseNum(row['Sales']);

      if (!rowTime) return;
      if (storeFilter !== 'All' && store !== storeFilter) return;
      if (groupFilter !== 'All' && groupName !== groupFilter) return;

      // --- 1. LOGIC BẢNG GAP ---
      if (sku) {
        const key = `${groupName}_${sku}`;
        if (!gapMap[key]) gapMap[key] = { group: groupName, sku, name, open:0, process:0, import:0, export:0, sales:0, waste:0, stock:0, gap:0 };
        
        if (tType === 'Stock' && rowTime === openTime) gapMap[key].open += qty;
        if (tType === 'Stock' && rowTime === endTime) gapMap[key].stock += qty;
        
        if (rowTime >= startTime && rowTime <= endTime) {
          if (tType === 'Process') gapMap[key].process += qty;
          if (tType === 'Import') gapMap[key].import += qty;
          if (tType === 'Export') gapMap[key].export += qty;
          if (tType === 'Sales') gapMap[key].sales += qty;
          if (tType === 'Waste') gapMap[key].waste += qty;
        }
      }

      // --- 2. LOGIC BIỂU ĐỒ & KPI ---
      if (rowTime >= startTime && rowTime <= endTime) {
        fCount++;
        activeDates.add(dateStr);
        activeStores.add(store);

        const day = dateStr.split('-')[0] || 'N/A';
        if (!trendMap[day]) trendMap[day] = { day, revenue: 0, target: 0, discountAmt: 0, waste: 0, countBill: 0, cancel: 0 };

        if (tType === 'Sales') {
          rev += gross; totalDiscount += disc; trendMap[day].revenue += gross; trendMap[day].discountAmt += disc;
          if (sku) {
            if (!salesMapByGroup[groupName]) salesMapByGroup[groupName] = {};
            if (!salesMapByGroup[groupName][sku]) salesMapByGroup[groupName][sku] = { sku, name, qty: 0 };
            salesMapByGroup[groupName][sku].qty += qty;
          }
        }
        if (tType === 'Count-Bills') { countBills += qty; trendMap[day].countBill += qty; }
        if (tType === 'Cancel') { cancelBills += qty; trendMap[day].cancel += qty; }
        if (tType === 'Target') trendMap[day].target += salesVal;
        if (tType === 'Payment') paymentMap[tInfo || 'Khác'] = (paymentMap[tInfo || 'Khác'] || 0) + salesVal;

        if (tType === 'Waste') {
          waste += qty; trendMap[day].waste += qty;
          if (sku) {
            if (!wasteMapByGroup[groupName]) wasteMapByGroup[groupName] = {};
            if (!wasteMapByGroup[groupName][sku]) wasteMapByGroup[groupName][sku] = { sku, name, qty: 0 };
            wasteMapByGroup[groupName][sku].qty += qty;
          }
        }

        // --- THEO DÕI VẬN HÀNH PHIẾU TREO / THIẾU TICKET ---
        if (tType === 'Ticket') { 
          // Đánh dấu đã nhận Waste-Ticket
          if (tInfo === 'Waste-Ticket' && qty > 0) {
            if (!wasteTrackMap[store]) wasteTrackMap[store] = {};
            wasteTrackMap[store][dateStr] = true;
          }
          // Đánh dấu đã nhận Stock-Ticket
          if (tInfo === 'Stock-Ticket' && qty > 0) {
            if (!stockTrackMap[store]) stockTrackMap[store] = {};
            stockTrackMap[store][dateStr] = true;
          }

          if (['Buying-Ticket', 'Process-Ticket', 'Import-Ticket'].includes(tInfo)) {
            if (tInfo === 'Buying-Ticket') pStats.buying += qty;
            if (tInfo === 'Process-Ticket') pStats.process += qty;
            if (tInfo === 'Import-Ticket') pStats.import += qty;

            const tKey = `${dateStr}_${store}_${tInfo}`;
            if (!ticketAgg[tKey]) {
              const agingDays = Math.floor((today - rowTime) / 86400000);
              ticketAgg[tKey] = { date: dateStr, store, type: tInfo, qty: 0, aging: agingDays > 0 ? agingDays : 0 };
            }
            ticketAgg[tKey].qty += qty;
          }
        }
      }
    });

    const tData = Object.values(trendMap).map(d => ({ ...d, discount: d.revenue > 0 ? (d.discountAmt / d.revenue) * 100 : 0 })).sort((a, b) => parseInt(a.day) - parseInt(b.day));
    const pColors = ['#2563eb', '#f97316', '#10b981', '#fbbf24', '#8b5cf6', '#ec4899', '#0ea5e9', '#84cc16', '#a855f7', '#f43f5e', '#64748b'];
    const pData = Object.keys(paymentMap).map(k => ({ name: k, value: paymentMap[k] })).sort((a, b) => b.value - a.value).map((item, i) => ({ ...item, color: pColors[i % pColors.length] }));
    const tSalesGroup = Object.keys(salesMapByGroup).map(group => ({ group, items: Object.values(salesMapByGroup[group]).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) })).filter(g => g.items.length > 0);
    const tWasteGroup = Object.keys(wasteMapByGroup).map(group => ({ group, items: Object.values(wasteMapByGroup[group]).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) })).filter(g => g.items.length > 0);
    
    // BẢNG GAP (Ẩn nhóm 'Khác' và sắp xếp A-Z)
    const gData = Object.values(gapMap).map(r => { 
      r.gap = r.open + r.process + r.import - r.export - r.sales - r.waste - r.stock; 
      return r; 
    })
    .filter(r => r.gap !== 0 && r.group !== 'Khác') 
    .sort((a, b) => a.group.localeCompare(b.group)); 

    // --- CHỐT DANH SÁCH THIẾU WASTE-TICKET & STOCK-TICKET ---
    const allTickets = Object.values(ticketAgg).filter(t => t.qty > 0);
    const missingTicketsList: any[] = [];
    
    activeStores.forEach(st => {
      activeDates.forEach(dt => {
        const tDate = parseDataDate(dt) || today;
        const agingDays = Math.floor((today - tDate) / 86400000);
        
        // Kiểm tra thiếu Waste-Ticket
        if (!wasteTrackMap[st] || !wasteTrackMap[st][dt]) {
          missingTicketsList.push({
            date: dt, store: st, type: 'THIẾU WASTE-TICKET', qty: 'N/A', aging: agingDays > 0 ? agingDays : 0, isMissing: true
          });
          pStats.missingWaste++;
        }
        
        // Kiểm tra thiếu Stock-Ticket
        if (!stockTrackMap[st] || !stockTrackMap[st][dt]) {
          missingTicketsList.push({
            date: dt, store: st, type: 'THIẾU STOCK-TICKET', qty: 'N/A', aging: agingDays > 0 ? agingDays : 0, isMissing: true
          });
          pStats.missingStock++;
        }
      });
    });

    const finalAgingTickets = [...allTickets, ...missingTicketsList].sort((a, b) => {
      // Ưu tiên hiện các phiếu thiếu lên trên cùng
      if (a.isMissing && !b.isMissing) return -1;
      if (!a.isMissing && b.isMissing) return 1;
      return b.aging - a.aging;
    });

    return {
      netRevenue: rev, totalBills: countBills, aov: countBills > 0 ? rev / countBills : 0, discountRateTB: rev > 0 ? (totalDiscount / rev) * 100 : 0,
      wasteQty: waste, cancelRate: countBills > 0 ? (cancelBills / countBills) * 100 : 0,
      trendData: tData, paymentData: pData, topSalesByGroup: tSalesGroup, topWasteByGroup: tWasteGroup, agingTickets: finalAgingTickets, pendingStats: pStats, gapData: gData, filteredCount: fCount
    };
  }, [rawData, storeFilter, groupFilter, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-medium text-lg">Đang đọc dữ liệu vận hành...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-[#f8f9fa] min-h-screen font-sans text-gray-800">
      
      {/* SLICERS */}
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
            Đang lọc: {formatUS(filteredCount)} records
          </div>
        </div>
      </div>

      {/* SCORECARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Net revenue</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate" title={formatUS(netRevenue)}>{formatUS(netRevenue)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Count-Bills</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(totalBills)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">AOV</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(aov)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Discount rate TB</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(discountRateTB)}%</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Waste Qty</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600 truncate">{formatUS(wasteQty)}</p></div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100"><p className="text-xs sm:text-sm text-gray-500 font-medium">Cancel rate</p><p className="text-lg sm:text-2xl font-bold mt-1 truncate">{formatUS(cancelRate)}%</p></div>
      </div>

      {/* CHARTS TẦNG 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Doanh thu theo ngày</h3>
          <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[300px]">
            <div className="absolute inset-0">
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
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Cơ cấu thanh toán</h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
             <div className="h-48 sm:h-64 w-full md:w-1/2 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-1.5 sm:gap-2">
              {paymentData.map((p, i) => (
                <div key={i} className="flex items-start justify-between text-[11px] sm:text-xs xl:text-sm w-full border-b border-gray-50 pb-1.5 last:border-0">
                  <div className="flex items-start flex-1 pr-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2 mt-[3px] shrink-0" style={{ backgroundColor: p.color }}></span>
                    <span className="text-gray-600 leading-tight">{p.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0 text-right mt-[1px]">{formatUS(p.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS TẦNG 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Discount rate theo ngày (%)</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
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
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Waste Qty theo ngày</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
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
      </div>

      {/* BẢNG TOP THEO GROUP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 SP bán chạy (Theo Group)</h3>
          <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
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
                        <td className="py-2 px-2 text-xs sm:text-sm">{item.sku}</td><td className="py-2 px-1 font-medium truncate max-w-[150px] sm:max-w-[250px]" title={item.name}>{item.name}</td><td className="py-2 px-2 text-right font-semibold text-gray-700 text-xs sm:text-sm">{formatUS(item.qty)}</td>
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
          <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
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
                        <td className="py-2 px-2 text-xs sm:text-sm">{item.sku}</td><td className="py-2 px-1 font-medium truncate max-w-[150px] sm:max-w-[250px]" title={item.name}>{item.name}</td><td className="py-2 px-2 text-right font-semibold text-gray-700 text-xs sm:text-sm">{formatUS(item.qty)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PHIẾU TREO */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4">Đối soát vận hành — Phiếu treo</h3>
        {/* Chỉnh lại Grid để chứa đủ 5 thẻ (2 dòng trên mobile, 5 cột trên màn to) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Buying-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.buying)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Process-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.process)}</p></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Import-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.import)}</p></div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-xs text-red-600 truncate font-semibold">Thiếu Waste-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{formatUS(pendingStats.missingWaste)}</p></div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-xs text-red-600 truncate font-semibold">Thiếu Stock-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{formatUS(pendingStats.missingStock)}</p></div>
        </div>
        <div className="overflow-y-auto overflow-x-auto max-h-[350px]">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="pb-3 px-2 font-medium">Cửa hàng</th><th className="pb-3 px-2 font-medium">Ngày</th><th className="pb-3 px-2 font-medium">Loại phiếu</th><th className="pb-3 px-2 font-medium text-center">Qty</th><th className="pb-3 px-2 font-medium text-center">Số ngày treo</th>
              </tr>
            </thead>
            <tbody>
              {agingTickets.map((ticket, idx) => {
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
              {agingTickets.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500">Tuyệt vời! Không có phiếu nào đang treo hoặc thiếu sót.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BẢNG GAP */}
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