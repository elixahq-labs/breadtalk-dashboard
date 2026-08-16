import React, { memo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, AlertCircle } from 'lucide-react';

function ReviewsTab({ data, utils, reviewFilter }: { data: any, utils: any, reviewFilter: string }) {
  const { formatUS, renderPoP } = utils;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <div className={`bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center transition-opacity ${reviewFilter === 'Customer Surveys' ? 'opacity-40' : ''}`}>
          <p className="text-[10px] sm:text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Maps Avg Rating</p>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <span className="text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl font-black text-[#2b3674] mr-1 sm:mr-2">{data.avgMapsRating.toFixed(2)}</span>
              <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 sm:w-10 sm:h-10 drop-shadow-sm" />
            </div>
            {renderPoP(data.avgMapsRating, data.prevStats.prevAvgMaps, false)}
          </div>
        </div>
        <div className={`bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center transition-opacity ${reviewFilter === 'Google Maps' ? 'opacity-40' : ''}`}>
          <p className="text-[10px] sm:text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Survey Avg Rating</p>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <span className="text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl font-black text-[#2b3674] mr-1 sm:mr-2">{data.avgCusRating.toFixed(2)}</span>
              <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 sm:w-10 sm:h-10 drop-shadow-sm" />
            </div>
            {renderPoP(data.avgCusRating, data.prevStats.prevAvgCus, false)}
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
          <p className="text-[10px] sm:text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Reviews</p>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <span className="text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl font-black text-[#00d084]">{formatUS(data.totalReviews)}</span>
            </div>
            {renderPoP(data.totalReviews, data.prevStats.prevTotalReviews, false)}
          </div>
        </div>
        <div className="bg-[#2b3674] p-4 sm:p-6 rounded-3xl shadow-lg flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <p className="text-[10px] sm:text-sm text-blue-200 font-semibold uppercase tracking-wider mb-2">Mistakes</p>
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="flex items-center justify-center">
              <span className="text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl font-black text-white mr-1 sm:mr-2">{formatUS(data.totalMistakes)}</span>
              <AlertCircle className="text-red-400 w-6 h-6 sm:w-10 sm:h-10" />
            </div>
            {renderPoP(data.totalMistakes, data.prevStats.prevTotalMistakes, true, true)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-stretch">
        <div className={`bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full transition-opacity ${reviewFilter === 'Customer Surveys' ? 'hidden lg:flex opacity-40' : ''}`}>
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Maps Rating Dist.</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
             <div className="h-40 sm:h-48 w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.mapsDistData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.mapsDistData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full flex flex-col gap-2 px-2 mt-4">
              {data.mapsDistData.map((p:any, i:number) => (
                <div key={i} className="flex items-center justify-between text-xs w-full">
                  <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: p.color }}></span><span className="text-slate-600 font-medium">{p.name}</span></div>
                  <span className="font-bold text-[#2b3674]">{formatUS(p.value)}</span>
                </div>
              ))}
              {data.mapsDistData.length === 0 && <p className="text-xs text-slate-400 text-center w-full">No data</p>}
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full transition-opacity ${reviewFilter === 'Google Maps' ? 'hidden lg:flex opacity-40' : ''}`}>
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Survey Rating Dist.</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
             <div className="h-40 sm:h-48 w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.cusDistData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.cusDistData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full flex flex-col gap-2 px-2 mt-4">
              {data.cusDistData.map((p:any, i:number) => (
                <div key={i} className="flex items-center justify-between text-xs w-full">
                  <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: p.color }}></span><span className="text-slate-600 font-medium">{p.name}</span></div>
                  <span className="font-bold text-[#2b3674]">{formatUS(p.value)}</span>
                </div>
              ))}
              {data.cusDistData.length === 0 && <p className="text-xs text-slate-400 text-center w-full">No data</p>}
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full ${(reviewFilter === 'Google Maps' || reviewFilter === 'Customer Surveys') ? 'lg:col-span-2' : ''}`}>
          <h3 className="font-bold mb-6 text-sm sm:text-base text-[#2b3674] shrink-0">Mistakes by Category</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mistakeCatDist} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatUS(value)} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="qty" fill="#ef4444" radius={[0, 8, 8, 0]} barSize={20} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-6 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4 text-red-500">Operational Mistakes Log</h3>
        <div className="overflow-y-auto overflow-x-auto max-h-[350px] mt-2 relative border border-slate-100 rounded-2xl">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-red-50 z-10">
              <tr className="text-red-800 border-b border-red-100">
                <th className="py-4 px-4 font-bold">Date</th>
                <th className="py-4 px-4 font-bold">Store</th>
                <th className="py-4 px-4 font-bold">Category</th>
                <th className="py-4 px-4 font-bold">Source</th>
                <th className="py-4 px-4 font-bold w-1/2">Details</th>
              </tr>
            </thead>
            <tbody>
              {data.mistakeList.map((row:any, idx:number) => (
                <tr key={idx} className="border-b border-slate-50 text-slate-700 hover:bg-red-50/30 transition-colors">
                  <td className="py-4 px-4 text-xs sm:text-sm">{row.date}</td>
                  <td className="py-4 px-4 text-xs sm:text-sm font-bold text-[#2b3674]">{row.store}</td>
                  <td className="py-4 px-4 text-xs sm:text-sm font-medium text-red-500">{row.category}</td>
                  <td className="py-4 px-4 text-xs sm:text-sm text-slate-400">{row.source}</td>
                  <td className="py-4 px-4 text-xs sm:text-sm whitespace-normal min-w-[200px] leading-relaxed">{row.details}</td>
                </tr>
              ))}
              {data.mistakeList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No operational mistakes recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-4 text-[#4318FF]">Recent Customer Reviews</h3>
        <div className="overflow-y-auto overflow-x-auto max-h-[800px] mt-2 relative border border-slate-100 rounded-2xl">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-[#f4f7fe] z-10">
              <tr className="text-[#2b3674] border-b border-[#e2e8f0]">
                <th className="py-4 px-4 font-bold">Date</th>
                <th className="py-4 px-4 font-bold">Store</th>
                <th className="py-4 px-4 font-bold text-center">Rating</th>
                <th className="py-4 px-4 font-bold">Platform</th>
                <th className="py-4 px-4 font-bold w-1/2">Review Text</th>
              </tr>
            </thead>
            <tbody>
              {data.reviewList.map((row:any, idx:number) => (
                <tr key={idx} className="border-b border-slate-50 text-slate-700 hover:bg-[#f4f7fe]/50 transition-colors">
                  <td className="py-4 px-4 text-xs sm:text-sm">{row.date}</td>
                  <td className="py-4 px-4 text-xs sm:text-sm font-bold text-[#2b3674]">{row.store}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1.5 w-fit mx-auto">
                      <span className="font-bold text-xs mr-1.5 text-slate-800">{row.rating}</span>
                      <Star className={`w-3.5 h-3.5 ${row.rating >= 4 ? 'text-[#00d084] fill-[#00d084]' : row.rating === 3 ? 'text-yellow-400 fill-yellow-400' : 'text-red-500 fill-red-500'}`} />
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs sm:text-sm text-slate-400">{row.source}</td>
                  <td className="py-4 px-4 text-xs sm:text-sm whitespace-normal min-w-[300px] italic text-slate-600 leading-relaxed">"{row.text}"</td>
                </tr>
              ))}
              {data.reviewList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No written reviews available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default memo(ReviewsTab);