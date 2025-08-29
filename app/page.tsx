'use client';

import { useState, useMemo, FC } from 'react';
import type { FormEvent } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

// --- Type Definitions ---
interface ReviewSnippet {
  rating?: number;
  snippet?: string;
}

interface ReviewData {
  source: string;
  rating: number;
  count: number;
  distribution: { [key: string]: number };
  reviews: ReviewSnippet[];
}

// --- Helper Components & Icons ---
const IconLink = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const IconStar = ({ className = 'text-yellow-400' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-cyan-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

// --- Recharts Custom Components ---
const COLORS = ['#06B6D4', '#2DD4BF', '#67E8F9', '#A5F3FC', '#CFFAFE'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-5} textAnchor="middle" fill="#E5E7EB" className="font-bold text-2xl">{`${payload.rating} Stars`}</text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#9CA3AF">{`(${(percent * 100).toFixed(0)}%)`}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};


// --- Main Dashboard Component ---
export default function Home() {
  const [urls, setUrls] = useState<string>('');
  const [data, setData] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setData([]);

    const urlList = urls.split('\n').filter(url => url.trim() !== '');
    if (urlList.length === 0) {
      setError('Please enter at least one URL.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scrape-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from the backend.');
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const summary = useMemo(() => {
    if (data.length === 0) return { avgRating: 0, totalReviews: 0, sourceCount: 0 };
    const totalReviews = data.reduce((sum, item) => sum + (item.count || 0), 0);
    const weightedTotalRating = data.reduce((sum, item) => sum + (item.rating || 0) * (item.count || 0), 0);
    const avgRating = totalReviews > 0 ? (weightedTotalRating / totalReviews) : 0;
    return {
      avgRating: parseFloat(avgRating.toFixed(2)),
      totalReviews,
      sourceCount: data.length,
    };
  }, [data]);

  const ratingDistributionData = useMemo(() => {
    const combined = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    data.forEach(source => {
      if (source.distribution) {
        for (const [rating, count] of Object.entries(source.distribution)) {
          const key = rating.charAt(0);
          if (combined.hasOwnProperty(key)) {
            combined[key as keyof typeof combined] += count;
          }
        }
      }
    });
    return [
        { rating: 5, count: combined['5'] },
        { rating: 4, count: combined['4'] },
        { rating: 3, count: combined['3'] },
        { rating: 2, count: combined['2'] },
        { rating: 1, count: combined['1'] },
    ];
  }, [data]);

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* --- Left Sidebar --- */}
      <aside className="w-full max-w-md p-8 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-cyan-400">Review Aggregator</h1>
          <p className="text-gray-400 mt-2">Consolidated Hotel Insights</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
          <div>
            <label htmlFor="urls" className="block text-sm font-semibold text-gray-300 mb-2">
              Hotel URLs (one per line)
            </label>
            <textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="https://www.booking.com/hotel/in/the-leela-palace-chennai.html&#10;https://www.tripadvisor.in/Hotel_Review-g304556-d3240217-Reviews-The_Leela_Palace_Chennai-Chennai_Madras_Chennai_District_Tamil_Nadu.html"
            />
          </div>
          
          <div className="flex-grow"></div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {loading ? 'Aggregating...' : 'Aggregate Reviews'}
          </button>
        </form>
        
        {error && (
          <div className="p-4 mt-6 text-center text-sm rounded-md bg-red-900/50 text-red-300">
            {error}
          </div>
        )}
      </aside>

      {/* --- Right Panel: Dashboard --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading && <div className="text-center text-gray-400 pt-20">Loading and analyzing review data...</div>}
        
        {!loading && data.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            <div>
              <h2 className="text-2xl font-semibold">Dashboard is ready</h2>
              <p>Enter URLs on the left to begin aggregation.</p>
            </div>
          </div>
        )}

        {!loading && data.length > 0 && (
          <div className="space-y-8">
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-4">
                <IconLink />
                <div>
                  <h3 className="text-gray-400 text-sm font-medium">Sources Analyzed</h3>
                  <p className="text-3xl font-bold mt-1">{summary.sourceCount}</p>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-4">
                <IconStar className="text-cyan-400" />
                <div>
                  <h3 className="text-gray-400 text-sm font-medium">Weighted Avg. Rating</h3>
                  <p className="text-3xl font-bold mt-1">{summary.avgRating}</p>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-4">
                <IconUsers />
                <div>
                  <h3 className="text-gray-400 text-sm font-medium">Total Reviews</h3>
                  <p className="text-3xl font-bold mt-1">{summary.totalReviews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* --- Visualizations --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie 
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={ratingDistributionData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={80}
                            outerRadius={110} 
                            fill="#8884d8"
                            dataKey="count"
                            onMouseEnter={onPieEnter}
                        >
                            {ratingDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Ratings by Source</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis type="number" domain={[0, 5]} stroke="#A0AEC0" fontSize={12} />
                    <YAxis type="category" dataKey="source" width={80} stroke="#A0AEC0" fontSize={12} />
                    <Tooltip cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4A5568' }} />
                    <Bar dataKey="rating" fill="#2DD4BF" name="Rating" background={{ fill: '#2D3748' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- Recent Reviews Table --- */}
            <div className="bg-gray-800 rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Recent Review Snippets</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-700/50 text-xs text-gray-400 uppercase">
                    <tr>
                      <th scope="col" className="px-6 py-3">Source</th>
                      <th scope="col" className="px-6 py-3">Recent Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item.source} className="border-b border-gray-700">
                        <td className="px-6 py-4 font-medium text-white align-top w-1/4">{item.source}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            {item.reviews && item.reviews.map((review, index) => (
                              <div key={index} className="text-gray-300">
                                <p className="italic">"{review.snippet || 'No snippet available.'}"</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
