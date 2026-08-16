"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Loader2 } from 'lucide-react';

// IMPORT TABS GIAO DIỆN
import OverviewTab from './tabs/OverviewTab';
import InventoryTab from './tabs/InventoryTab';
import MarketingTab from './tabs/MarketingTab';
import ReviewsTab from './tabs/ReviewsTab';
import WorkforceAnalyticsTab from './tabs/WorkforceAnalyticsTab';
import PnLTab from './tabs/PnLTab';

export default function DashboardClient({ fileNames }: { fileNames: string[] }) {
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ĐIỀU HƯỚNG TAB
  const [activeTab, setActiveTab] = useState('Overview');

  const [storeFilter, setStoreFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [reviewFilter, setReviewFilter] = useState('All');

  // KHỞI TẠO MẶC ĐỊNH NGÀY N-1 (HÔM QUA)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

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

  const getDaysInMonth = (monthStr: string) => {
    const months: any = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
    const parts = monthStr.split('.');
    if(parts.length !== 2) return 30; // Default fallback
    const m = months[parts[0]];
    let y = parseInt(parts[1], 10);
    if (y < 100) y += 2000;
    return new Date(y, m, 0).getDate(); // Returns last day of the month
  };

  const stores = useMemo(() => Array.from(new Set(rawData.map(d => clean(d['Store-Name'])).filter(Boolean))), [rawData]);
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(rawData.map(d => clean(d['Group'])).filter(Boolean)));
    return uniqueGroups.sort((a: string, b: string) => a.localeCompare(b));
  }, [rawData]);

  const baseFilteredData = useMemo(() => {
    return rawData.filter(row => {
      const store = clean(row['Store-Name']);
      const groupName = clean(row['Group']) || 'Others';
      if (storeFilter !== 'All' && store !== storeFilter) return false;
      if (groupFilter !== 'All' && groupName !== groupFilter) return false;
      return true;
    });
  }, [rawData, storeFilter, groupFilter]);

  // BỘ NÃO TÍNH TOÁN DỮ LIỆU CHÍNH
  const calculatedData = useMemo(() => {
    let curRev = 0, curRevAfterDisc = 0, curCommissions = 0, curVat = 0;
    let totalDiscount = 0, countBills = 0, cancelBills = 0, waste = 0, salesQty = 0;
    
    let prevRev = 0, prevRevAfterDisc = 0, prevCommissions = 0, prevVat = 0;
    let prevTotalDiscount = 0, prevCountBills = 0, prevCancelBills = 0, prevWaste = 0, prevSalesQty = 0;

    let mktPromoRev = 0, mktPromoDisc = 0, mktPromoQty = 0;
    let prevMktPromoRev = 0, prevMktPromoDisc = 0, prevMktPromoQty = 0;

    const trendMap: Record<string, any> = {};
    const paymentMap: Record<string, number> = {};
    const prevPaymentMap: Record<string, number> = {};
    
    const gapMap: Record<string, any> = {};
    const ticketAgg: Record<string, any> = {};
    const pStats = { buying: 0, process: 0, import: 0, missingWaste: 0, missingStock: 0 };
    
    const wasteTrackMap: Record<string, Record<string, boolean>> = {};
    const stockTrackMap: Record<string, Record<string, boolean>> = {};
    const activeDates = new Set<string>();
    const activeStores = new Set<string>();
    
    const salesMapByGroup: Record<string, Record<string, any>> = {};
    const wasteMapByGroup: Record<string, Record<string, any>> = {};
    const promoMap: Record<string, { name: string, qty: number, sales: number, discount: number, gross: number, storeMap: Record<string, any> }> = {}; 

    const wasteByStoreMap: Record<string, { name: string, actual: number, target: number }> = {};
    const wasteGroupMap: Record<string, number> = {};
    const prevWasteGroupMap: Record<string, number> = {};
    const cancelReasonMap: Record<string, number> = {};

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
    const diffDaysTotal = Math.max(1, Math.round((endTime - startTime) / 86400000) + 1);

    const shiftDate = (timestamp: number, months: number) => {
      const d = new Date(timestamp);
      const expectedMonth = (d.getMonth() + months) % 12;
      const targetMonth = expectedMonth < 0 ? expectedMonth + 12 : expectedMonth;
      d.setMonth(d.getMonth() + months);
      if (d.getMonth() !== targetMonth) d.setDate(0);
      return d.getTime();
    };

    let prevStartTime = 0;
    let prevEndTime = 0;
    
    if (startTime && endTime) {
      if (startTime === endTime) {
        prevStartTime = startTime - 86400000;
        prevEndTime = endTime - 86400000;
      } else {
        let shiftM = 0;
        if (diffDaysTotal <= 31) shiftM = -1;
        else if (diffDaysTotal <= 92) shiftM = -3;
        else if (diffDaysTotal <= 184) shiftM = -6;
        else shiftM = -12;
        prevStartTime = shiftDate(startTime, shiftM);
        prevEndTime = shiftDate(endTime, shiftM);
      }
    }

    const openTime = startTime - 86400000;

    // STEP 1: INITIALIZE TREND MAP FOR BOTH CURRENT AND PREV TO ENSURE MATCHING DAYS
    // Create an array of formatted "day" strings (e.g., "01", "02") for the selected period
    for (let i = 0; i < diffDaysTotal; i++) {
        const d = new Date(startTime + i * 86400000);
        const dayStr = String(d.getDate()).padStart(2, '0');
        // Map will hold current data, and we will find corresponding prev data based on index
        if (!trendMap[dayStr]) {
            trendMap[dayStr] = { 
                day: dayStr, 
                revenue: 0, prevRevenue: 0,
                target: 0, 
                discountAmt: 0, prevDiscountAmt: 0,
                waste: 0, prevWaste: 0,
                cancel: 0, promoRevenue: 0 
            };
        }
    }

    baseFilteredData.forEach(row => {
      const store = clean(row['Store-Name']);
      const storeCode = clean(row['Store-Code']) || store; 
      const groupName = clean(row['Group']) || 'Others';
      const sku = clean(row['SKU']);
      const name = clean(row['Product-Name']);
      const tType = clean(row['Ticket-Type']);
      const tInfo = clean(row['Type-Info']);
      const dateStr = clean(row['Date']);
      const monthStr = clean(row['Month']); // Lấy cột Month
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

      // XỬ LÝ TARGET THÁNG ĐƯỢC CHIA VÀO KỲ HIỆN TẠI
      if (tType === 'Target' && monthStr) {
          // Parse monthStr (e.g., "Aug.24") to check if it overlaps with selected period
          const monthsMapping: any = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
          const p = monthStr.split('.');
          if (p.length === 2) {
              const mIdx = monthsMapping[p[0]];
              let y = parseInt(p[1], 10);
              if (y < 100) y += 2000;
              
              const targetMonthStart = new Date(y, mIdx, 1).getTime();
              const targetMonthEnd = new Date(y, mIdx + 1, 0).getTime();
              
              // Check overlap with current sliced period
              const overlapStart = Math.max(startTime, targetMonthStart);
              const overlapEnd = Math.min(endTime, targetMonthEnd);
              
              if (overlapStart <= overlapEnd) {
                  const daysInTargetMonth = new Date(y, mIdx + 1, 0).getDate();
                  const overlapDays = Math.round((overlapEnd - overlapStart) / 86400000) + 1;
                  
                  // Tính Target chia theo tỷ trọng ngày
                  const allocatedSalesTarget = (salesVal / daysInTargetMonth) * overlapDays;
                  const allocatedWasteTarget = (qty / daysInTargetMonth) * overlapDays;
                  
                  // Phân bổ đều vào các ngày trong trendMap đang nằm trong overlap
                  const dailySalesTarget = salesVal / daysInTargetMonth;

                  for (let i = 0; i < overlapDays; i++) {
                      const curDayTime = overlapStart + (i * 86400000);
                      const dObj = new Date(curDayTime);
                      const dStr = String(dObj.getDate()).padStart(2, '0');
                      if (trendMap[dStr]) {
                          if (tInfo === 'Sales') trendMap[dStr].target += dailySalesTarget;
                      }
                  }

                  if (tInfo === 'Sales') {
                      // Total Target handled via daily allocation above or could be summed up separately if needed.
                  } else if (tInfo.toLowerCase() === 'waste') {
                      if (!wasteByStoreMap[storeCode]) wasteByStoreMap[storeCode] = { name: storeCode, actual: 0, target: 0 };
                      wasteByStoreMap[storeCode].target += allocatedWasteTarget;
                  }
              }
          }
      }


      const isMapsReview = sourceMistake.includes('Maps') || tType === 'Maps-Reviews';
      const passReviewFilter = reviewFilter === 'All' || (reviewFilter === 'Google Maps' && isMapsReview) || (reviewFilter === 'Customer Surveys' && !isMapsReview);

      if (isPrevPeriod) {
        if (tType === 'Sales') { 
          prevRev += salesVal; prevRevAfterDisc += gross; prevTotalDiscount += disc; prevVat += rowVat; prevSalesQty += qty; 
          if (sku) {
            if (!salesMapByGroup[groupName]) salesMapByGroup[groupName] = {};
            if (!salesMapByGroup[groupName][sku]) salesMapByGroup[groupName][sku] = { sku, name, qty: 0, prevQty: 0 };
            salesMapByGroup[groupName][sku].prevQty += qty;
          }
          // Log daily prev for charts. Find matching day index.
          const pDayIdx = Math.round((rowTime - prevStartTime) / 86400000);
          const matchedCurrentDate = new Date(startTime + (pDayIdx * 86400000));
          if (matchedCurrentDate.getTime() <= endTime) {
              const dStr = String(matchedCurrentDate.getDate()).padStart(2, '0');
              if (trendMap[dStr]) {
                  trendMap[dStr].prevRevenue += gross;
                  trendMap[dStr].prevDiscountAmt += disc;
              }
          }
        }
        if (tType === 'Commissions') prevCommissions += salesVal;
        if (tType === 'Count-Bills') prevCountBills += qty;
        if (tType === 'Cancel') prevCancelBills += qty;
        if (tType === 'Payment') {
            const pMethod = tInfo || 'Others';
            prevPaymentMap[pMethod] = (prevPaymentMap[pMethod] || 0) + salesVal;
        }
        if (tType === 'Waste') { 
          prevWaste += qty; 
          prevWasteGroupMap[groupName] = (prevWasteGroupMap[groupName] || 0) + qty;
          
          if (sku) {
            if (!wasteMapByGroup[groupName]) wasteMapByGroup[groupName] = {};
            if (!wasteMapByGroup[groupName][sku]) wasteMapByGroup[groupName][sku] = { sku, name, qty: 0, prevQty: 0 };
            wasteMapByGroup[groupName][sku].prevQty += qty;
          }

          const pDayIdx = Math.round((rowTime - prevStartTime) / 86400000);
          const matchedCurrentDate = new Date(startTime + (pDayIdx * 86400000));
          if (matchedCurrentDate.getTime() <= endTime) {
              const dStr = String(matchedCurrentDate.getDate()).padStart(2, '0');
              if (trendMap[dStr]) {
                  trendMap[dStr].prevWaste += qty;
              }
          }
        }
        if (tType === 'Promotion') { prevMktPromoRev += gross; prevMktPromoDisc += disc; prevMktPromoQty += qty; }
        if (tType === 'Cus-Reviews' || tType === 'Reviews') {
          if (passReviewFilter && qty > 0 && qty <= 5) {
             if (isMapsReview) { prevMapsSumRating += qty; prevMapsCountRating++; } else { prevCusSumRating += qty; prevCusCountRating++; }
          }
        }
        if (tType === 'Mistake') prevCountMistakes += qty;
      }

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

      if (isCurrentPeriod || isDateEmpty) {
        
        if (tType === 'Cus-Reviews' || tType === 'Reviews') {
          if (passReviewFilter) {
            if (qty > 0 && qty <= 5) {
               const rounded = Math.round(qty);
               if (isMapsReview) {
                 mapsSumRating += qty; mapsCountRating++;
                 if (rounded === 5) mapsRatingCountMap['5 Stars']++; else if (rounded === 4) mapsRatingCountMap['4 Stars']++; else if (rounded === 3) mapsRatingCountMap['3 Stars']++; else if (rounded === 2) mapsRatingCountMap['2 Stars']++; else if (rounded === 1) mapsRatingCountMap['1 Star']++;
               } else {
                 cusSumRating += qty; cusCountRating++;
                 if (rounded === 5) cusRatingCountMap['5 Stars']++; else if (rounded === 4) cusRatingCountMap['4 Stars']++; else if (rounded === 3) cusRatingCountMap['3 Stars']++; else if (rounded === 2) cusRatingCountMap['2 Stars']++; else if (rounded === 1) cusRatingCountMap['1 Star']++;
               }
            }
            if (tType === 'Reviews' && mistakeDetails) rList.push({ date: dateStr || 'N/A', store: store, rating: qty, source: sourceMistake, text: mistakeDetails });
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
        // Note: trendMap is already initialized for valid days, this ensures 'N/A' or unexpected gets logged but might not chart well
        if (!trendMap[day]) trendMap[day] = { day, revenue: 0, prevRevenue: 0, target: 0, discountAmt: 0, prevDiscountAmt: 0, waste: 0, prevWaste: 0, countBill: 0, cancel: 0, promoRevenue: 0 };

        if (tType === 'Sales') {
          curRev += salesVal; curRevAfterDisc += gross; curVat += rowVat; totalDiscount += disc; salesQty += qty;
          trendMap[day].revenue += gross; trendMap[day].discountAmt += disc;
          if (sku) {
            if (!salesMapByGroup[groupName]) salesMapByGroup[groupName] = {};
            if (!salesMapByGroup[groupName][sku]) salesMapByGroup[groupName][sku] = { sku, name, qty: 0, prevQty: 0 };
            salesMapByGroup[groupName][sku].qty += qty;
          }
        }
        
        if (tType === 'Commissions') curCommissions += salesVal;
        if (tType === 'Count-Bills') { countBills += qty; trendMap[day].countBill += qty; }
        if (tType === 'Payment') paymentMap[tInfo || 'Others'] = (paymentMap[tInfo || 'Others'] || 0) + salesVal;

        if (tType === 'Cancel') { 
          cancelBills += qty; 
          trendMap[day].cancel += qty; 
          const cReason = tInfo || 'Others';
          cancelReasonMap[cReason] = (cancelReasonMap[cReason] || 0) + qty;
        }

        if (tType === 'Waste') {
          waste += qty; trendMap[day].waste += qty;
          
          if (!wasteByStoreMap[storeCode]) wasteByStoreMap[storeCode] = { name: storeCode, actual: 0, target: 0 };
          wasteByStoreMap[storeCode].actual += qty;
          
          wasteGroupMap[groupName] = (wasteGroupMap[groupName] || 0) + qty;

          if (sku) {
            if (!wasteMapByGroup[groupName]) wasteMapByGroup[groupName] = {};
            if (!wasteMapByGroup[groupName][sku]) wasteMapByGroup[groupName][sku] = { sku, name, qty: 0, prevQty: 0 };
            wasteMapByGroup[groupName][sku].qty += qty;
          }
        }

        if (tType === 'Promotion') {
          const pName = tInfo || 'Others';
          mktPromoRev += gross; mktPromoDisc += disc; mktPromoQty += qty;
          trendMap[day].promoRevenue += gross;
          
          if (!promoMap[pName]) {
            promoMap[pName] = { name: pName, qty: 0, sales: 0, discount: 0, gross: 0, storeMap: {} };
          }
          promoMap[pName].qty += qty; 
          promoMap[pName].sales += salesVal; 
          promoMap[pName].discount += disc; 
          promoMap[pName].gross += gross;
          
          if (!promoMap[pName].storeMap[store]) {
            promoMap[pName].storeMap[store] = { name: store, qty: 0, sales: 0, discount: 0, gross: 0 };
          }
          promoMap[pName].storeMap[store].qty += qty;
          promoMap[pName].storeMap[store].sales += salesVal;
          promoMap[pName].storeMap[store].discount += disc;
          promoMap[pName].storeMap[store].gross += gross;
        }

        if (tType === 'Ticket') { 
          if (tInfo === 'Waste-Ticket' && qty > 0) { if (!wasteTrackMap[store]) wasteTrackMap[store] = {}; wasteTrackMap[store][dateStr] = true; }
          if (tInfo === 'Stock-Ticket' && qty > 0) { if (!stockTrackMap[store]) stockTrackMap[store] = {}; stockTrackMap[store][dateStr] = true; }
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

    const curRoyalty = (curRevAfterDisc - curCommissions - curVat) * 0.05;
    const curNetRevenue = curRevAfterDisc - curCommissions - curVat - curRoyalty;
    const curWasteRatio = (salesQty + waste) > 0 ? (waste / (salesQty + waste)) * 100 : 0;

    const prevRoyalty = (prevRevAfterDisc - prevCommissions - prevVat) * 0.05;
    const prevNetRevenue = prevRevAfterDisc - prevCommissions - prevVat - prevRoyalty;
    const pWasteRatio = (prevSalesQty + prevWaste) > 0 ? (prevWaste / (prevSalesQty + prevWaste)) * 100 : 0;

    // Tính toán thêm Discount Rate cho biểu đồ
    const tData = Object.values(trendMap).map(d => ({ 
      ...d, 
      discount: d.revenue > 0 ? (d.discountAmt / d.revenue) * 100 : 0,
      prevDiscount: d.prevRevenue > 0 ? (d.prevDiscountAmt / d.prevRevenue) * 100 : 0
    })).sort((a, b) => parseInt(a.day) - parseInt(b.day));
    
    // Xử lý Dữ liệu Payment Methods kèm Prev
    const pColors = ['#4318FF', '#F15A2B', '#00B574', '#FFB703', '#8b5cf6', '#ec4899', '#0ea5e9', '#84cc16', '#a855f7', '#f43f5e', '#64748b'];
    const totalPayment = Object.values(paymentMap).reduce((sum, val) => sum + val, 0);
    const pData = Object.keys(paymentMap).map(k => ({ 
      name: k, 
      value: paymentMap[k],
      prevValue: prevPaymentMap[k] || 0,
      percent: totalPayment > 0 ? (paymentMap[k] / totalPayment) * 100 : 0
    })).sort((a, b) => b.value - a.value).map((item, i) => ({ ...item, color: pColors[i % pColors.length] }));
    
    const tSalesGroup = Object.keys(salesMapByGroup).map(group => ({ 
      group, 
      items: Object.values(salesMapByGroup[group]).filter((i:any) => i.qty > 0).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) 
    })).filter(g => g.items.length > 0);
    
    const tWasteGroup = Object.keys(wasteMapByGroup).map(group => ({ 
      group, 
      items: Object.values(wasteMapByGroup[group]).filter((i:any) => i.qty > 0).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5) 
    })).filter(g => g.items.length > 0);
    
    const gData = Object.values(gapMap).map(r => { r.gap = r.open + r.process + r.import - r.export - r.sales - r.waste - r.stock; return r; }).filter(r => r.gap !== 0 && r.group !== 'Others').sort((a, b) => a.group.localeCompare(b.group)); 

    const cReasonData = Object.keys(cancelReasonMap).map(k => ({ name: k, qty: cancelReasonMap[k] })).sort((a, b) => b.qty - a.qty);
    
    const wStoreData = Object.values(wasteByStoreMap).map(s => ({
      ...s,
      avgWaste: s.actual / diffDaysTotal
    })).sort((a, b) => b.actual - a.actual);
    
    // Xử lý dữ liệu Waste Breakdown kèm Prev
    const wColors = ['#ef4444', '#f97316', '#f59e0b', '#fbbf24', '#eab308', '#84cc16', '#22c55e', '#0ea5e9', '#3b82f6', '#8b5cf6', '#d946ef'];
    const wGroupData = Object.keys(wasteGroupMap).map((k, i) => ({ 
      name: k, 
      value: wasteGroupMap[k], 
      prevValue: prevWasteGroupMap[k] || 0,
      color: wColors[i % wColors.length] 
    })).sort((a, b) => b.value - a.value);

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

    const mktPromoList = Object.values(promoMap).map(p => {
      const storesArr = Object.values(p.storeMap)
        .filter(s => s.qty !== 0 || s.sales !== 0 || s.discount !== 0 || s.gross !== 0)
        .sort((a, b) => b.gross - a.gross);
      return { ...p, stores: storesArr };
    }).sort((a, b) => b.gross - a.gross);

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
      revenue: prevRev, revAfterDisc: prevRevAfterDisc, commissions: prevCommissions, vatValue: prevVat, royalty: prevRoyalty, trueNetRevenue: prevNetRevenue,
      totalBills: prevCountBills, aov: prevCountBills > 0 ? prevRevAfterDisc / prevCountBills : 0, discountRateTB: prevRevAfterDisc > 0 ? (prevTotalDiscount / prevRevAfterDisc) * 100 : 0,
      wasteQty: prevWaste, wasteRatio: pWasteRatio, cancelRate: prevCountBills > 0 ? (prevCancelBills / prevCountBills) * 100 : 0, 
      promoRev: prevMktPromoRev, promoDisc: prevMktPromoDisc, promoQty: prevMktPromoQty,
      prevAvgMaps: prevMapsCountRating > 0 ? prevMapsSumRating / prevMapsCountRating : 0, prevAvgCus: prevCusCountRating > 0 ? prevCusSumRating / prevCusCountRating : 0,
      prevTotalReviews: prevMapsCountRating + prevCusCountRating, prevTotalMistakes: prevCountMistakes
    };

    return {
      revenue: curRev, revAfterDisc: curRevAfterDisc, commissions: curCommissions, vatValue: curVat, royalty: curRoyalty, trueNetRevenue: curNetRevenue,
      totalBills: countBills, aov: countBills > 0 ? curRevAfterDisc / countBills : 0, discountRateTB: curRevAfterDisc > 0 ? (totalDiscount / curRevAfterDisc) * 100 : 0,
      wasteQty: waste, wasteRatio: curWasteRatio, cancelRate: countBills > 0 ? (cancelBills / countBills) * 100 : 0,
      trendData: tData, paymentData: pData, topSalesByGroup: tSalesGroup, topWasteByGroup: tWasteGroup, 
      wasteByStoreData: wStoreData, wasteByGroupData: wGroupData, cancelReasonData: cReasonData,
      agingTickets: finalAgingTickets, pendingStats: pStats, gapData: gData, filteredCount: fCount,
      promoRev: mktPromoRev, promoDisc: mktPromoDisc, promoQty: mktPromoQty, promoList: mktPromoList, topPromoByQty: mktTopByQty, topPromoByRev: mktTopByRev,
      avgMapsRating: aMapsRating, avgCusRating: aCusRating, totalReviews: tReviews, reviewList: rList, mapsDistData: mDistData, cusDistData: cDistData,
      totalMistakes: countMistakes, mistakeList: mList, mistakeCatDist: mCatDistData,
      prevStats: prevStatsResult 
    };
  }, [baseFilteredData, startDate, endDate, rawData, reviewFilter]);

  const renderPoP = (current: number, prev: number, inverseColor: boolean = false, isDarkBg: boolean = false) => {
    if (!prev || prev === 0) return <span className={`text-[11px] sm:text-xs font-normal mt-1 ${isDarkBg ? 'text-blue-200' : 'text-slate-400'}`}>--</span>; 
    const changePercent = ((current - prev) / prev) * 100;
    const isPositive = changePercent > 0;
    const isZero = changePercent === 0;
    
    let bgClass = "";
    let textClass = "";

    if (isZero) {
        bgClass = isDarkBg ? 'bg-slate-400/20' : 'bg-slate-100';
        textClass = isDarkBg ? 'text-slate-300' : 'text-slate-500';
    } else if (isDarkBg) {
      bgClass = isPositive ? (inverseColor ? 'bg-red-400/20' : 'bg-[#00d084]/20') : (inverseColor ? 'bg-[#00d084]/20' : 'bg-red-400/20');
      textClass = isPositive ? (inverseColor ? 'text-red-300' : 'text-[#00d084]') : (inverseColor ? 'text-[#00d084]' : 'text-red-300');
    } else {
      bgClass = isPositive ? (inverseColor ? 'bg-red-50' : 'bg-emerald-50') : (inverseColor ? 'bg-emerald-50' : 'bg-red-50');
      textClass = isPositive ? (inverseColor ? 'text-red-600' : 'text-emerald-600') : (inverseColor ? 'text-emerald-600' : 'text-red-600');
    }

    const arrow = isZero ? '-' : (isPositive ? '↑' : '↓');
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide mt-1 w-max ${bgClass} ${textClass}`}>
        {arrow} {isZero ? '0' : Math.abs(changePercent).toFixed(1)}% <span className="ml-1 font-medium opacity-70 hidden xl:inline">vs prev</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fe] text-[#4318FF]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold text-lg text-[#2b3674]">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-[#f4f7fe] min-h-screen font-sans text-slate-800">
      
      <div className="mb-6 bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-start">
          <h1 className="text-xl font-bold text-[#2b3674] tracking-tight">BreadTalk VietNam</h1>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-full overflow-x-auto w-full md:w-auto shadow-inner no-scrollbar">
          {['Overview', 'Inventory', 'Marketing', 'Reviews', 'HR', 'PnL'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[#4318FF] text-white shadow-md' 
                  : 'text-slate-500 hover:text-[#2b3674] hover:bg-slate-100'
              }`}>
              {tab === 'HR' ? 'Workforce Analytics' : tab}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <span className="text-[10px] text-slate-400 italic">Project by Arthur</span>
        </div>

      </div>

      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div className="w-full md:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2b3674]">{activeTab === 'HR' ? 'Workforce Analytics' : activeTab} Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Your current operations summary and activity</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-2 text-sm font-medium shadow-sm hover:border-blue-300 outline-none cursor-pointer">
            <option value="All">All Stores</option>
            {stores.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <div className="flex flex-row items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm text-sm font-medium">
            <input type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} className="outline-none bg-transparent text-slate-600 cursor-pointer"/>
            <span className="text-slate-400 mx-2">-</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className="outline-none bg-transparent text-slate-600 cursor-pointer"/>
          </div>

          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-2 text-sm font-medium shadow-sm hover:border-blue-300 outline-none cursor-pointer">
            <option value="All">All Groups</option>
            {groups.map((g: any) => <option key={g} value={g}>{g}</option>)}
          </select>
          
          {activeTab === 'Reviews' && (
            <select value={reviewFilter} onChange={e => setReviewFilter(e.target.value)} className="bg-[#4318FF] border border-[#4318FF] text-white rounded-full px-4 py-2 text-sm font-medium shadow-md hover:bg-blue-800 outline-none cursor-pointer">
              <option value="All">All Reviews</option>
              <option value="Google Maps">Maps Only</option>
              <option value="Customer Surveys">Surveys Only</option>
            </select>
          )}
        </div>
      </div>

      {activeTab === 'Overview' && <OverviewTab data={calculatedData} utils={{ formatUS, renderPoP }} />}
      {activeTab === 'Inventory' && <InventoryTab data={calculatedData} utils={{ formatUS }} />}
      {activeTab === 'Marketing' && <MarketingTab data={calculatedData} utils={{ formatUS, renderPoP }} />}
      {activeTab === 'Reviews' && <ReviewsTab data={calculatedData} utils={{ formatUS, renderPoP }} reviewFilter={reviewFilter} />}
      {activeTab === 'HR' && <WorkforceAnalyticsTab data={calculatedData} utils={{ formatUS, renderPoP }} />}
      {activeTab === 'PnL' && <PnLTab data={calculatedData} utils={{ formatUS, renderPoP }} />}
      
    </div>
  );
}