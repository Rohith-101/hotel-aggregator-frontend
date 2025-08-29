'use client';

import { useState, FormEvent, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Type Definitions ---
interface Review {
  source: string;
  rating: number;
  count: number;
  distribution: { [key: number]: number };
  reviews: { rating: number; snippet: string }[];
}

// --- Main Component ---
export default function Home() {
  const [urls, setUrls] = useState<string>('');
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

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
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(review =>
      review.source.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const chartData = useMemo(() => {
    return filteredReviews.map(review => ({
      name: review.source,
      'Overall Rating': review.rating,
    }));
  }, [filteredReviews]);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-cyan-400">Hotel Review Aggregator</h1>
          <p className="text-gray-400 mt-2">Consolidate hotel reviews from multiple sources into one dashboard.</p>
        </header>

        {/* Input Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
          <form onSubmit={handleSubmit}>
            <label htmlFor="urls" className="block text-sm font-medium text-gray-300 mb-2">
              Enter Hotel URLs (one per line)
            </label>
            <textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="https://www.booking.com/hotel/in/the-leela-palace-chennai.html&#10;https://www.tripadvisor.in/Hotel_Review-g304556-d3240217-Reviews-The_Leela_Palace_Chennai-Chennai_Madras_Chennai_District_Tamil_Nadu.html"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Aggregating Reviews...' : 'Aggregate Reviews'}
            </button>
          </form>
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>

        {/* Dashboard Section */}
        {data.length > 0 && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Filter by source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-1/3 bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredReviews.map(review => (
                <div key={review.source} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold text-cyan-500">{review.source}</h2>
                  <p className="text-5xl font-extrabold my-4">{review.rating?.toFixed(1) ?? 'N/A'}<span className="text-2xl text-gray-400">/5</span></p>
                  <p className="text-gray-400">{review.count?.toLocaleString() ?? 'N/A'} reviews</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
              <h3 className="text-xl font-bold mb-4">Overall Ratings Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="name" stroke="#A0AEC0" />
                  <YAxis stroke="#A0AEC0" domain={[0, 5]} />
                  <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                  <Legend />
                  <Bar dataKey="Overall Rating" fill="#2DD4BF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
