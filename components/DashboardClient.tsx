"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line, LineChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Star, AlertCircle } from 'lucide-react';

export default function DashboardClient({ fileNames }: { fileNames: string[] }) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TAB NAVIGATION
  const [activeTab, setActiveTab] = useState('Overview');

  // SLICER STATES
  const [storeFilter, setStoreFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // REVIEWS SOURCE SLICER
  const [reviewFilter, setReviewFilter] = useState('All');

  // FETCH DATA
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
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (fileNames.length > 0) loadData(); else setIsLoading(false);
  }, [fileNames]);

  // HELPER FUNCTIONS
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

  // PRE-FILTER DATA
  const baseFilteredData = useMemo(() => {
    return rawData.filter(row => {
      const store = clean(row['Store-Name']);
      const groupName = clean(row['Group']) || 'Others';
      if (storeFilter !== 'All' && store !== storeFilter) return false;
      if (groupFilter !== 'All' && groupName !== groupFilter) return false;
      return true;
    });
  }, [rawData, storeFilter, groupFilter]);

  // CORE DATA PROCESSING
  const { 
    revenue, revAfterDisc, commissions, vatValue, royalty, trueNetRevenue, 
    totalBills, aov, discountRateTB, wasteQty, cancelRate, 
    trendData, paymentData, topSalesByGroup, topWasteByGroup, 
    agingTickets, pendingStats, gapData, filteredCount, prevStats,
    promoRev, promoDisc, promoQty, promoList, topPromoByQty, topPromoByRev,
    avgMapsRating, avgCusRating, totalReviews, reviewList, 
    mapsDistData, cusDistData, totalMistakes, mistakeList, mistakeCatDist
  } = useMemo(() => {
    
    // CURRENT PERIOD VARS (Financial)
    let curRev = 0, curRevAfterDisc = 0, curCommissions = 0, curVat = 0;
    let totalDiscount = 0, countBills = 0, cancelBills = 0, waste = 0;
    
    // PREVIOUS PERIOD VARS (Financial)
    let prevRev = 0, prevRevAfterDisc = 0, prevCommissions = 0, prevVat = 0;
    let prevTotalDiscount = 0, prevCountBills = 0, prevCancelBills = 0, prevWaste = 0;

    let mktPromoRev = 0, mktPromoDisc = 0, mktPromoQty = 0;
    let prevMktPromoRev = 0, prevMktPromoDisc = 0, prevMktPromoQty = 0;

    const trendMap: Record<string, any> = {};
    const paymentMap: Record<string, number> = {};
    const gapMap: Record<string, any> = {};
    const ticketAgg: Record<string, any> = {};
    const pStats = { buying: 0, process: 0, import: 0, missingWaste: 0, missingStock: 0 };
    
    const wasteTrackMap: Record<string, Record<string, boolean>> = {};
    const stockTrackMap: Record<string, Record<string, boolean>> = {};
    const activeDates = new Set<string>();
    const activeStores = new Set<string>();
    
    const salesMapByGroup: Record<string, Record<string, any>> = {};
    const wasteMapByGroup: Record<string, Record<string, any>> = {};
    const promoMap: Record<string, any> = {}; 

    // REVIEWS & MISTAKES VARS
    let mapsSumRating = 0, mapsCountRating = 0;
    let cusSumRating = 0, cusCountRating = 0;
    let countMistakes = 0;
    let prevMapsSumRating = 0, prevMapsCountRating = 0;
    let prevCusSumRating = 0, prevCusCountRating = 0;
    let prevCountMistakes = 0;

    const rList: any[] = [];
    const mList: any[] = [];
    const mapsRatingCountMap: Record<string, number> = { '5 Stars': 0, '4 Stars': 0, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 };
    const cusRatingCountMap: Record<string, number> = { '5 Stars': 0, '4 Stars': 0, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 };
    const mistakeCatMap: Record<string, number> = {};
    
    let fCount = 0;
    const today = new Date('2026-08-12').getTime(); 

    let minTime = Infinity, maxTime = -Infinity;
    rawData.forEach(r => {
        const t = parseDataDate(r['Date']);
        if (t) { if (t < minTime) minTime = t; if (t > maxTime) maxTime = t; }
    });
    
    const startTime = parseInputDate(startDate) || minTime;
    const endTime = parseInputDate(endDate) || maxTime;
    
    const diff = endTime - startTime; 
    const prevEndTime = startTime - 86400000;
    const prevStartTime = prevEndTime - diff;
    const openTime = startTime - 86400000;

    baseFilteredData.forEach(row => {
      const store = clean(row['Store-Name']);
      const groupName = clean(row['Group']) || 'Others';
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
      const rowVat = parseNum(row['VAT']);
      
      const sourceMistake = clean(row['Source-Mistake']);
      const mistakeDetails = clean(row['Mistake-Details']);

      const isCurrentPeriod = rowTime && rowTime >= startTime && rowTime <= endTime;
      const isPrevPeriod = rowTime && rowTime >= prevStartTime && rowTime <= prevEndTime;
      const isDateEmpty = !rowTime; 

      const isMapsReview = sourceMistake.includes('Maps') || tType === 'Maps-Reviews';
      const passReviewFilter = reviewFilter === 'All' 
        || (reviewFilter === 'Google Maps' && isMapsReview)
        || (reviewFilter === 'Customer Surveys' && !isMapsReview);

      // --- 1. PREVIOUS PERIOD LOGIC (PoP) ---
      if (isPrevPeriod) {
        if (tType === 'Sales') { 
          prevRev += salesVal; 
          prevRevAfterDisc += gross; 
          prevTotalDiscount += disc; 
          prevVat += rowVat;
        }
        if (tType === 'Commissions') prevCommissions += salesVal;
        
        if (tType === 'Count-Bills') prevCountBills += qty;
        if (tType === 'Cancel') prevCancelBills += qty;
        if (tType === 'Waste') prevWaste += qty;
        
        if (tType === 'Promotion') {
          prevMktPromoRev += gross;
          prevMktPromoDisc += disc;
          prevMktPromoQty += qty;
        }
        if (tType === 'Cus-Reviews' || tType === 'Reviews') {
          if (passReviewFilter && qty > 0 && qty <= 5) {
             if (isMapsReview) { prevMapsSumRating += qty; prevMapsCountRating++; }
             else { prevCusSumRating += qty; prevCusCountRating++; }
          }
        }
        if (tType === 'Mistake') {
          prevCountMistakes += qty;
        }
      }

      // --- 2. GAP LOGIC ---
      if (sku) {
        const key = `${groupName}_${sku}`;
        if (!gapMap[key]) gapMap[key] = { group: groupName, sku, name, open:0, process:0, import:0, export:0, sales:0, waste:0, stock:0, gap:0 };
        
        if (tType === 'Stock' && rowTime === openTime) gapMap[key].open += qty;
        if (tType === 'Stock' && rowTime === endTime) gapMap[key].stock += qty;
        
        if (isCurrentPeriod) {
          if (tType === 'Process') gapMap[key].process += qty;
          if (tType === 'Import') gapMap[key].import += qty;
          if (tType === 'Export') gapMap[key].export += qty;
          if (tType === 'Sales') gapMap[key].sales += qty;
          if (tType === 'Waste') gapMap[key].waste += qty;
        }
      }

      // --- 3. CURRENT PERIOD LOGIC ---
      if (isCurrentPeriod || isDateEmpty) {
        
        if (tType === 'Cus-Reviews' || tType === 'Reviews') {
          if (passReviewFilter) {
            if (qty > 0 && qty <= 5) {
               const rounded = Math.round(qty);
               if (isMapsReview) {
                 mapsSumRating += qty; mapsCountRating++;
                 if (rounded === 5) mapsRatingCountMap['5 Stars']++;
                 else if (rounded === 4) mapsRatingCountMap['4 Stars']++;
                 else if (rounded === 3) mapsRatingCountMap['3 Stars']++;
                 else if (rounded === 2) mapsRatingCountMap['2 Stars']++;
                 else if (rounded === 1) mapsRatingCountMap['1 Star']++;
               } else {
                 cusSumRating += qty; cusCountRating++;
                 if (rounded === 5) cusRatingCountMap['5 Stars']++;
                 else if (rounded === 4) cusRatingCountMap['4 Stars']++;
                 else if (rounded === 3) cusRatingCountMap['3 Stars']++;
                 else if (rounded === 2) cusRatingCountMap['2 Stars']++;
                 else if (rounded === 1) cusRatingCountMap['1 Star']++;
               }
            }
            if (tType === 'Reviews' && mistakeDetails) {
               rList.push({ date: dateStr || 'N/A', store: store, rating: qty, source: sourceMistake, text: mistakeDetails });
            }
          }
        }

        if (tType === 'Mistake') {
          countMistakes += qty;
          const catName = tInfo || 'Uncategorized';
          mistakeCatMap[catName] = (mistakeCatMap[catName] || 0) + qty;
          mList.push({ date: dateStr || 'N/A', store: store, category: catName, source: sourceMistake, details: mistakeDetails, qty: qty });
        }

        if (!isCurrentPeriod) return; 

        fCount++;
        activeDates.add(dateStr);
        activeStores.add(store);

        const day = dateStr.split('-')[0] || 'N/A';
        if (!trendMap[day]) trendMap[day] = { day, revenue: 0, target: 0, discountAmt: 0, waste: 0, countBill: 0, cancel: 0, promoRevenue: 0 };

        if (tType === 'Sales') {
          curRev += salesVal;
          curRevAfterDisc += gross; 
          curVat += rowVat;
          totalDiscount += disc; 
          trendMap[day].revenue += gross; // Chart dùng Revenue after discount
          trendMap[day].discountAmt += disc;
          
          if (sku) {
            if (!salesMapByGroup[groupName]) salesMapByGroup[groupName] = {};
            if (!salesMapByGroup[groupName][sku]) salesMapByGroup[groupName][sku] = { sku, name, qty: 0 };
            salesMapByGroup[groupName][sku].qty += qty;
          }
        }
        
        if (tType === 'Commissions') curCommissions += salesVal;

        if (tType === 'Count-Bills') { countBills += qty; trendMap[day].countBill += qty; }
        if (tType === 'Cancel') { cancelBills += qty; trendMap[day].cancel += qty; }
        if (tType === 'Target') trendMap[day].target += salesVal;
        if (tType === 'Payment') paymentMap[tInfo || 'Others'] = (paymentMap[tInfo || 'Others'] || 0) + salesVal;

        if (tType === 'Waste') {
          waste += qty; trendMap[day].waste += qty;
          if (sku) {
            if (!wasteMapByGroup[groupName]) wasteMapByGroup[groupName] = {};
            if (!wasteMapByGroup[groupName][sku]) wasteMapByGroup[groupName][sku] = { sku, name, qty: 0 };
            wasteMapByGroup[groupName][sku].qty += qty;
          }
        }

        if (tType === 'Promotion') {
          const pName = tInfo || 'Others';
          mktPromoRev += gross; mktPromoDisc += disc; mktPromoQty += qty;
          trendMap[day].promoRevenue += gross;
          if (!promoMap[pName]) promoMap[pName] = { name: pName, qty: 0, sales: 0, discount: 0, gross: 0 };
          promoMap[pName].qty += qty; promoMap[pName].sales += salesVal; promoMap[pName].discount += disc; promoMap[pName].gross += gross;
        }

        if (tType === 'Ticket') { 
          if (tInfo === 'Waste-Ticket' && qty > 0) {
            if (!wasteTrackMap[store]) wasteTrackMap[store] = {};
            wasteTrackMap[store][dateStr] = true;
          }
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

    // TÍNH TOÁN FINANCIALS CUỐI CÙNG
    const curRoyalty = (curRevAfterDisc - curCommissions - curVat) * 0.05;
    const curNetRevenue = curRevAfterDisc - curCommissions - curVat - curRoyalty;

    const prevRoyalty = (prevRevAfterDisc - prevCommissions - prevVat) * 0.05;
    const prevNetRevenue = prevRevAfterDisc - prevCommissions - prevVat - prevRoyalty;

    // ĐÓNG GÓI CÁC BẢNG DỮ LIỆU
    const tData = Object.values(trendMap).map(d => ({ ...d, discount: d.revenue > 0 ? (d.discountAmt / d.revenue) * 100 : 0 })).sort((a, b) => parseInt(a.day) - parseInt(b.day));
    const pColors = ['#2563eb', '#f97316', '#10b981', '#fbbf24', '#8b5cf6', '#ec4899', '#0ea5e9', '#84cc16', '#a855f7', '#f43f5e', '#64748b'];
    const pData = Object.keys(paymentMap).map(k => ({ name: k, value: paymentMap[k] })).sort((a, b) => b.value - a.value).map((item, i) => ({ ...item, color: pColors[i % pColors.length] }));
    const tSalesGroup = Object.keys(salesMapByGroup).map(group => ({ group, items: Object.values(salesMapByGroup[group]).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) })).filter(g => g.items.length > 0);
    const tWasteGroup = Object.keys(wasteMapByGroup).map(group => ({ group, items: Object.values(wasteMapByGroup[group]).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) })).filter(g => g.items.length > 0);
    const gData = Object.values(gapMap).map(r => { r.gap = r.open + r.process + r.import - r.export - r.sales - r.waste - r.stock; return r; }).filter(r => r.gap !== 0 && r.group !== 'Others').sort((a, b) => a.group.localeCompare(b.group)); 

    const allTickets = Object.values(ticketAgg).filter(t => t.qty > 0);
    const missingTicketsList: any[] = [];
    activeStores.forEach(st => {
      activeDates.forEach(dt => {
        const tDate = parseDataDate(dt) || today;
        const agingDays = Math.floor((today - tDate) / 86400000);
        if (!wasteTrackMap[st] || !wasteTrackMap[st][dt]) {
          missingTicketsList.push({ date: dt, store: st, type: 'MISSING WASTE-TICKET', qty: 'N/A', aging: agingDays > 0 ? agingDays : 0, isMissing: true });
          pStats.missingWaste++;
        }
        if (!stockTrackMap[st] || !stockTrackMap[st][dt]) {
          missingTicketsList.push({ date: dt, store: st, type: 'MISSING STOCK-TICKET', qty: 'N/A', aging: agingDays > 0 ? agingDays : 0, isMissing: true });
          pStats.missingStock++;
        }
      });
    });

    const finalAgingTickets = [...allTickets, ...missingTicketsList].sort((a, b) => {
      if (a.isMissing && !b.isMissing) return -1;
      if (!a.isMissing && b.isMissing) return 1;
      return b.aging - a.aging;
    });

    const mktPromoList = Object.values(promoMap).sort((a, b) => b.gross - a.gross); 
    const mktTopByQty = [...mktPromoList].sort((a, b) => b.qty - a.qty).slice(0, 10);
    const mktTopByRev = [...mktPromoList].sort((a, b) => b.gross - a.gross).slice(0, 10);

    const aMapsRating = mapsCountRating > 0 ? mapsSumRating / mapsCountRating : 0;
    const aCusRating = cusCountRating > 0 ? cusSumRating / cusCountRating : 0;
    const tReviews = mapsCountRating + cusCountRating;
    
    const rColors = ['#10b981', '#84cc16', '#fbbf24', '#f97316', '#ef4444'];
    const mDistData = Object.keys(mapsRatingCountMap).map((k, i) => ({ name: k, value: mapsRatingCountMap[k], color: rColors[i] })).filter(x => x.value > 0);
    const cDistData = Object.keys(cusRatingCountMap).map((k, i) => ({ name: k, value: cusRatingCountMap[k], color: rColors[i] })).filter(x => x.value > 0);
    const mCatDistData = Object.keys(mistakeCatMap).map(k => ({ name: k, qty: mistakeCatMap[k] })).sort((a, b) => b.qty - a.qty);

    const prevStatsResult = {
      revenue: prevRev,
      revAfterDisc: prevRevAfterDisc,
      commissions: prevCommissions,
      vatValue: prevVat,
      royalty: prevRoyalty,
      trueNetRevenue: prevNetRevenue,
      totalBills: prevCountBills,
      aov: prevCountBills > 0 ? prevRevAfterDisc / prevCountBills : 0,
      discountRateTB: prevRevAfterDisc > 0 ? (prevTotalDiscount / prevRevAfterDisc) * 100 : 0,
      wasteQty: prevWaste,
      cancelRate: prevCountBills > 0 ? (prevCancelBills / prevCountBills) * 100 : 0,
      promoRev: prevMktPromoRev,
      promoDisc: prevMktPromoDisc,
      promoQty: prevMktPromoQty,
      prevAvgMaps: prevMapsCountRating > 0 ? prevMapsSumRating / prevMapsCountRating : 0,
      prevAvgCus: prevCusCountRating > 0 ? prevCusSumRating / prevCusCountRating : 0,
      prevTotalReviews: prevMapsCountRating + prevCusCountRating,
      prevTotalMistakes: prevCountMistakes
    };

    return {
      revenue: curRev, revAfterDisc: curRevAfterDisc, commissions: curCommissions, vatValue: curVat, royalty: curRoyalty, trueNetRevenue: curNetRevenue,
      totalBills: countBills, aov: countBills > 0 ? curRevAfterDisc / countBills : 0, discountRateTB: curRevAfterDisc > 0 ? (totalDiscount / curRevAfterDisc) * 100 : 0,
      wasteQty: waste, cancelRate: countBills > 0 ? (cancelBills / countBills) * 100 : 0,
      trendData: tData, paymentData: pData, topSalesByGroup: tSalesGroup, topWasteByGroup: tWasteGroup, agingTickets: finalAgingTickets, pendingStats: pStats, gapData: gData, filteredCount: fCount,
      promoRev: mktPromoRev, promoDisc: mktPromoDisc, promoQty: mktPromoQty, promoList: mktPromoList, topPromoByQty: mktTopByQty, topPromoByRev: mktTopByRev,
      avgMapsRating: aMapsRating, avgCusRating: aCusRating, totalReviews: tReviews, reviewList: rList, mapsDistData: mDistData, cusDistData: cDistData,
      totalMistakes: countMistakes, mistakeList: mList, mistakeCatDist: mCatDistData,
      prevStats: prevStatsResult 
    };
  }, [baseFilteredData, startDate, endDate, rawData, reviewFilter]);

  const renderPoP = (current: number, prev: number, inverseColor: boolean = false) => {
    if (!prev || prev === 0) return <span className="text-[10px] sm:text-xs text-gray-400 ml-2 font-normal">--</span>; 
    if (current === prev) return null; 
    
    const changePercent = ((current - prev) / prev) * 100;
    const isPositive = changePercent > 0;
    
    const colorClass = isPositive 
      ? (inverseColor ? 'text-red-500' : 'text-green-500') 
      : (inverseColor ? 'text-green-500' : 'text-red-500');
      
    const arrow = isPositive ? '▲' : '▼';
    
    return (
      <span className={`text-[10px] sm:text-xs font-semibold ml-2 ${colorClass}`}>
        {arrow} {Math.abs(changePercent).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-medium text-lg">Loading operations data...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-[#f8f9fa] min-h-screen font-sans text-gray-800">
      
      {/* GLOBAL SLICERS */}
      <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Operations Dashboard</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('Overview')} 
              className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'Overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('Marketing')} 
              className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'Marketing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Marketing
            </button>
            <button 
              onClick={() => setActiveTab('Reviews')} 
              className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'Reviews' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Reviews & Mistakes
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm bg-white cursor-pointer hover:border-blue-500 w-full md:w-auto">
            <option value="All">-- All Stores --</option>
            {stores.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex flex-row items-center justify-between space-x-2 border border-gray-300 rounded-md bg-white p-1 w-full md:w-auto overflow-hidden">
            <span className="text-sm text-gray-500 pl-2 hidden sm:inline">From:</span>
            <input type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} className="p-1 text-sm outline-none bg-transparent text-gray-700 cursor-pointer w-full"/>
            <span className="text-sm text-gray-400">→</span>
            <span className="text-sm text-gray-500 hidden sm:inline">To:</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className="p-1 text-sm outline-none bg-transparent text-gray-700 cursor-pointer w-full pr-2"/>
          </div>
          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm bg-white cursor-pointer hover:border-blue-500 w-full md:w-auto">
            <option value="All">-- All Groups --</option>
            {groups.map((g: any) => <option key={g} value={g}>{g}</option>)}
          </select>
          
          {activeTab === 'Reviews' && (
            <select value={reviewFilter} onChange={e => setReviewFilter(e.target.value)} className="border border-blue-300 rounded-md p-2 text-sm bg-blue-50 text-blue-800 cursor-pointer hover:border-blue-500 w-full md:w-auto font-medium">
              <option value="All">-- All Review Sources --</option>
              <option value="Google Maps">Google Maps</option>
              <option value="Customer Surveys">Customer Surveys</option>
            </select>
          )}

          <div className="md:ml-auto flex items-center justify-center text-sm text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-md w-full md:w-auto">
            Filtering: {formatUS(filteredCount)} records
          </div>
        </div>
      </div>

      {/* =========================================
          TAB 1: OVERVIEW
      ========================================= */}
      {activeTab === 'Overview' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
            {/* ROW 1: FINANCIALS */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenue</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold truncate" title={formatUS(revenue)}>{formatUS(revenue)}</p>{renderPoP(revenue, prevStats.revenue, false)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Revenue after discount</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold text-blue-600 truncate" title={formatUS(revAfterDisc)}>{formatUS(revAfterDisc)}</p>{renderPoP(revAfterDisc, prevStats.revAfterDisc, false)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Commissions</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate" title={formatUS(commissions)}>{formatUS(commissions)}</p>{renderPoP(commissions, prevStats.commissions, true)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">VAT</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate" title={formatUS(vatValue)}>{formatUS(vatValue)}</p>{renderPoP(vatValue, prevStats.vatValue, true)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Royalty (5%)</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate" title={formatUS(royalty)}>{formatUS(royalty)}</p>{renderPoP(royalty, prevStats.royalty, true)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Net revenue</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold text-green-600 truncate" title={formatUS(trueNetRevenue)}>{formatUS(trueNetRevenue)}</p>{renderPoP(trueNetRevenue, prevStats.trueNetRevenue, false)}</div>
              <p className="text-[10px] text-gray-400 mt-1 italic">*Excluding OPEX & COGS</p>
            </div>

            {/* ROW 2: OPERATIONS */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Count-Bills</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(totalBills)}</p>{renderPoP(totalBills, prevStats.totalBills, false)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">AOV</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(aov)}</p>{renderPoP(aov, prevStats.aov, false)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Discount rate TB</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(discountRateTB)}%</p>{renderPoP(discountRateTB, prevStats.discountRateTB, true)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Waste Qty</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold text-red-600 truncate">{formatUS(wasteQty)}</p>{renderPoP(wasteQty, prevStats.wasteQty, true)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Cancel rate</p>
              <div className="flex items-baseline mt-1"><p className="text-lg sm:text-2xl font-bold truncate">{formatUS(cancelRate)}%</p>{renderPoP(cancelRate, prevStats.cancelRate, true)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Revenue</h3>
              <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[300px]">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
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
                      <Pie data={paymentData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                        {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatUS(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center gap-1.5 sm:gap-2">
                  {paymentData.map((p, i) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Discount Rate (%)</h3>
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
              <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Daily Waste Qty</h3>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 Best-Selling Products (By Group)</h3>
              <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium px-1">SKU</th><th className="pb-2 font-medium px-1">Product</th><th className="pb-2 font-medium px-1 text-right">Qty</th>
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
              <h3 className="font-bold mb-4 text-sm sm:text-base">Top 5 Waste Products (By Group)</h3>
              <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium px-1">SKU</th><th className="pb-2 font-medium px-1">Product</th><th className="pb-2 font-medium px-1 text-right">Qty</th>
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

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full overflow-hidden">
            <h3 className="font-bold text-base sm:text-lg mb-4">Operation Reconciliation — Pending Tickets</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Buying-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.buying)}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Process-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.process)}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><p className="text-xs text-gray-500 truncate">Import-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-gray-700">{formatUS(pendingStats.import)}</p></div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-xs text-red-600 truncate font-semibold">Missing Waste-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{formatUS(pendingStats.missingWaste)}</p></div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100"><p className="text-xs text-red-600 truncate font-semibold">Missing Stock-Ticket</p><p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{formatUS(pendingStats.missingStock)}</p></div>
            </div>
            <div className="overflow-y-auto overflow-x-auto max-h-[350px]">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="pb-3 px-2 font-medium">Store</th><th className="pb-3 px-2 font-medium">Date</th><th className="pb-3 px-2 font-medium">Ticket Type</th><th className="pb-3 px-2 font-medium text-center">Qty</th><th className="pb-3 px-2 font-medium text-center">Aging Days</th>
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
                          {formatUS(ticket.aging)}
                        </td>
                      </tr>
                    );
                  })}
                  {agingTickets.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-500">Great! No pending or missing tickets.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
            <h3 className="font-bold text-base sm:text-lg mb-2">Inventory GAP Table (GAP ≠ 0)</h3>
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
        </>
      )}


      {/* =========================================
          TAB 2: MARKETING
      ========================================= */}
      {activeTab === 'Marketing' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Promotion Revenue</p>
              <div className="flex items-baseline mt-2"><p className="text-xl sm:text-3xl font-bold text-blue-600 truncate" title={formatUS(promoRev)}>{formatUS(promoRev)}</p>{renderPoP(promoRev, prevStats.promoRev, false)}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Discount</p>
              <div className="flex items-baseline mt-2"><p className="text-xl sm:text-3xl font-bold text-orange-500 truncate" title={formatUS(promoDisc)}>{formatUS(promoDisc)}</p>{renderPoP(promoDisc, prevStats.promoDisc, true)}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Promotion Qty</p>
              <div className="flex items-baseline mt-2"><p className="text-xl sm:text-3xl font-bold text-gray-800 truncate">{formatUS(promoQty)}</p>{renderPoP(promoQty, prevStats.promoQty, false)}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Promo / Total Revenue (%)</p>
              <div className="flex items-baseline mt-2">
                <p className="text-xl sm:text-3xl font-bold text-gray-800 truncate">
                  {revAfterDisc > 0 ? formatUS((promoRev / revAfterDisc) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full mb-6">
            <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Revenue vs Promotion Revenue (Daily)</h3>
            <div className="flex-1 w-full relative min-h-[250px] sm:min-h-[350px]">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
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
                    <BarChart data={topPromoByQty} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    <BarChart data={topPromoByRev} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <div className="overflow-y-auto overflow-x-auto max-h-[500px] mt-2 relative">
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
                  {promoList.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 text-gray-700 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-xs sm:text-sm truncate max-w-[200px]" title={row.name}>{row.name}</td>
                      <td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.qty)}</td>
                      <td className="py-3 px-2 text-right text-xs sm:text-sm">{formatUS(row.sales)}</td>
                      <td className="py-3 px-2 text-right text-xs sm:text-sm text-orange-500">{formatUS(row.discount)}</td>
                      <td className="py-3 px-2 text-right font-bold text-xs sm:text-sm text-blue-600">{formatUS(row.gross)}</td>
                    </tr>
                  ))}
                  {promoList.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-500">No promotion data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================
          TAB 3: REVIEWS & MISTAKES
      ========================================= */}
      {activeTab === 'Reviews' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center transition-opacity ${reviewFilter === 'Customer Surveys' ? 'opacity-40' : ''}`}>
              <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Maps Avg Rating</p>
              <div className="flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-gray-800 mr-1">{avgMapsRating.toFixed(2)}</span>
                <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="mb-1">{renderPoP(avgMapsRating, prevStats.prevAvgMaps, false)}</div>
              </div>
            </div>
            <div className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center transition-opacity ${reviewFilter === 'Google Maps' ? 'opacity-40' : ''}`}>
              <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Survey Avg Rating</p>
              <div className="flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-gray-800 mr-1">{avgCusRating.toFixed(2)}</span>
                <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
                <div className="mb-1">{renderPoP(avgCusRating, prevStats.prevAvgCus, false)}</div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Total Reviews</p>
              <div className="flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-blue-600">{formatUS(totalReviews)}</span>
                <div className="mb-1">{renderPoP(totalReviews, prevStats.prevTotalReviews, false)}</div>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Operational Mistakes</p>
              <div className="flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-red-500 mr-1">{formatUS(totalMistakes)}</span>
                <AlertCircle className="text-red-500 w-6 h-6 sm:w-7 sm:h-7" />
                <div className="mb-1">{renderPoP(totalMistakes, prevStats.prevTotalMistakes, true)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-stretch">
            {/* MAPS RATING DISTRIBUTION */}
            <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full transition-opacity ${reviewFilter === 'Customer Surveys' ? 'hidden lg:flex opacity-40' : ''}`}>
              <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Maps Rating Dist.</h3>
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                 <div className="h-40 sm:h-48 w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mapsDistData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                        {mapsDistData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatUS(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full flex flex-col gap-1.5 px-2">
                  {mapsDistData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs w-full">
                      <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }}></span><span className="text-gray-600">{p.name}</span></div>
                      <span className="font-bold text-gray-900">{formatUS(p.value)}</span>
                    </div>
                  ))}
                  {mapsDistData.length === 0 && <p className="text-xs text-gray-500 text-center w-full">No data</p>}
                </div>
              </div>
            </div>

            {/* SURVEY RATING DISTRIBUTION */}
            <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full transition-opacity ${reviewFilter === 'Google Maps' ? 'hidden lg:flex opacity-40' : ''}`}>
              <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Survey Rating Dist.</h3>
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                 <div className="h-40 sm:h-48 w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cusDistData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                        {cusDistData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatUS(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full flex flex-col gap-1.5 px-2">
                  {cusDistData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs w-full">
                      <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }}></span><span className="text-gray-600">{p.name}</span></div>
                      <span className="font-bold text-gray-900">{formatUS(p.value)}</span>
                    </div>
                  ))}
                  {cusDistData.length === 0 && <p className="text-xs text-gray-500 text-center w-full">No data</p>}
                </div>
              </div>
            </div>

            {/* MISTAKES BY CATEGORY BAR CHART */}
            <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full ${(reviewFilter === 'Google Maps' || reviewFilter === 'Customer Surveys') ? 'lg:col-span-2' : ''}`}>
              <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Mistakes by Category</h3>
              <div className="flex-1 w-full relative min-h-[250px]">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mistakeCatDist} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#fef2f2'}} />
                      <Bar dataKey="qty" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* MISTAKES LOG TABLE */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full overflow-hidden">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-red-600">Operational Mistakes Log</h3>
            <div className="overflow-y-auto overflow-x-auto max-h-[350px] mt-2 relative border border-gray-100 rounded-lg">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-red-50 z-10">
                  <tr className="text-red-800 border-b border-red-100">
                    <th className="py-3 px-3 font-semibold">Date</th>
                    <th className="py-3 px-3 font-semibold">Store</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">Source</th>
                    <th className="py-3 px-3 font-semibold w-1/2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {mistakeList.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 text-gray-700 hover:bg-red-50/50">
                      <td className="py-3 px-3 text-xs sm:text-sm">{row.date}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm font-medium">{row.store}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm">{row.category}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm text-gray-500">{row.source}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm whitespace-normal min-w-[200px]">{row.details}</td>
                    </tr>
                  ))}
                  {mistakeList.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-500">No operational mistakes recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CUSTOMER REVIEWS TABLE */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-600">Recent Customer Reviews</h3>
            <div className="overflow-y-auto overflow-x-auto max-h-[400px] mt-2 relative border border-gray-100 rounded-lg">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-blue-50 z-10">
                  <tr className="text-blue-800 border-b border-blue-100">
                    <th className="py-3 px-3 font-semibold">Date</th>
                    <th className="py-3 px-3 font-semibold">Store</th>
                    <th className="py-3 px-3 font-semibold text-center">Rating</th>
                    <th className="py-3 px-3 font-semibold">Platform</th>
                    <th className="py-3 px-3 font-semibold w-1/2">Review Text</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewList.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 text-gray-700 hover:bg-blue-50/50">
                      <td className="py-3 px-3 text-xs sm:text-sm">{row.date}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm font-medium">{row.store}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center bg-gray-100 rounded-full px-2 py-1 w-fit mx-auto">
                          <span className="font-bold text-xs mr-1">{row.rating}</span>
                          <Star className={`w-3 h-3 ${row.rating >= 4 ? 'text-green-500 fill-green-500' : row.rating === 3 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500'}`} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs sm:text-sm text-gray-500">{row.source}</td>
                      <td className="py-3 px-3 text-xs sm:text-sm whitespace-normal min-w-[300px] italic">"{row.text}"</td>
                    </tr>
                  ))}
                  {reviewList.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-gray-500">No written reviews available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}