import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, AlertCircle } from 'lucide-react';

export default function ReviewsTab({ data, utils, reviewFilter }: { data: any, utils: any, reviewFilter: string }) {
  const { formatUS, renderPoP } = utils;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center transition-opacity ${reviewFilter === 'Customer Surveys' ? 'opacity-40' : ''}`}>
          <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Maps Avg Rating</p>
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-gray-800 mr-1">{data.avgMapsRating.toFixed(2)}</span>
            <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
            <div className="mb-1">{renderPoP(data.avgMapsRating, data.prevStats.prevAvgMaps, false)}</div>
          </div>
        </div>
        <div className={`bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center transition-opacity ${reviewFilter === 'Google Maps' ? 'opacity-40' : ''}`}>
          <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Survey Avg Rating</p>
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-gray-800 mr-1">{data.avgCusRating.toFixed(2)}</span>
            <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
            <div className="mb-1">{renderPoP(data.avgCusRating, data.prevStats.prevAvgCus, false)}</div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Total Reviews</p>
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-blue-600">{formatUS(data.totalReviews)}</span>
            <div className="mb-1">{renderPoP(data.totalReviews, data.prevStats.prevTotalReviews, false)}</div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Operational Mistakes</p>
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-red-500 mr-1">{formatUS(data.totalMistakes)}</span>
            <AlertCircle className="text-red-500 w-6 h-6 sm:w-7 sm:h-7" />
            <div className="mb-1">{renderPoP(data.totalMistakes, data.prevStats.prevTotalMistakes, true)}</div>
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
                  <Pie data={data.mapsDistData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.mapsDistData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full flex flex-col gap-1.5 px-2">
              {data.mapsDistData.map((p:any, i:number) => (
                <div key={i} className="flex items-center justify-between text-xs w-full">
                  <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }}></span><span className="text-gray-600">{p.name}</span></div>
                  <span className="font-bold text-gray-900">{formatUS(p.value)}</span>
                </div>
              ))}
              {data.mapsDistData.length === 0 && <p className="text-xs text-gray-500 text-center w-full">No data</p>}
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
                  <Pie data={data.cusDistData} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value">
                    {data.cusDistData.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatUS(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full flex flex-col gap-1.5 px-2">
              {data.cusDistData.map((p:any, i:number) => (
                <div key={i} className="flex items-center justify-between text-xs w-full">
                  <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }}></span><span className="text-gray-600">{p.name}</span></div>
                  <span className="font-bold text-gray-900">{formatUS(p.value)}</span>
                </div>
              ))}
              {data.cusDistData.length === 0 && <p className="text-xs text-gray-500 text-center w-full">No data</p>}
            </div>
          </div>
        </div>

        {/* MISTAKES BY CATEGORY BAR CHART */}
        <div className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full ${(reviewFilter === 'Google Maps' || reviewFilter === 'Customer Surveys') ? 'lg:col-span-2' : ''}`}>
          <h3 className="font-bold mb-4 text-sm sm:text-base shrink-0">Mistakes by Category</h3>
          <div className="flex-1 w-full relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mistakeCatDist} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
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
              {data.mistakeList.map((row:any, idx:number) => (
                <tr key={idx} className="border-b border-gray-50 text-gray-700 hover:bg-red-50/50">
                  <td className="py-3 px-3 text-xs sm:text-sm">{row.date}</td>
                  <td className="py-3 px-3 text-xs sm:text-sm font-medium">{row.store}</td>
                  <td className="py-3 px-3 text-xs sm:text-sm">{row.category}</td>
                  <td className="py-3 px-3 text-xs sm:text-sm text-gray-500">{row.source}</td>
                  <td className="py-3 px-3 text-xs sm:text-sm whitespace-normal min-w-[200px]">{row.details}</td>
                </tr>
              ))}
              {data.mistakeList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">No operational mistakes recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER REVIEWS TABLE */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-600">Recent Customer Reviews</h3>
        {/* ĐÃ CHỈNH SỬA TẠI ĐÂY: Thay max-h-[400px] thành max-h-[800px] để kéo dài bảng ra gấp đôi */}
        <div className="overflow-y-auto overflow-x-auto max-h-[800px] mt-2 relative border border-gray-100 rounded-lg">
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
              {data.reviewList.map((row:any, idx:number) => (
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
              {data.reviewList.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-500">No written reviews available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}