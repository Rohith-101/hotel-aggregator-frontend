'use client';

import { useState, useMemo, FC } from 'react';
import type { FormEvent } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Helper Components & Icons ---
const IconMapPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 text-gray-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block mr-1 text-yellow-400"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const IconGlobe = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const IconPhone = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 text-gray-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;

// --- Type Definitions ---
interface Business {
  name: string;
  category: string;
  address: string;
  rating: number;
  reviews: number;
  website: string;
  phone: string;
  priceLevel: string;
  hours: string;
  serviceOptions: string;
  latitude: number;
  longitude: number;
}

// --- Main Component ---
export default function Home() {
  const [query, setQuery] = useState('restaurants in Chennai');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [data, setData] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setData([]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setMessage('Error: API URL is not configured.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'An unknown error occurred.');
      
      // Assuming the backend returns the scraped data directly for the dashboard
      // This requires a modification in the backend to return the data instead of just a message.
      // For now, we'll use a mock response structure.
      setMessage(result.message);
      // In a real scenario, you would update the backend to return the scraped data:
      // setData(result.data); 

    } catch (error) {
      setMessage(error instanceof Error ? `Error: ${error.message}` : `An unexpected error occurred: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const averageRating = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, item) => sum + (item.rating || 0), 0);
    return (total / data.length).toFixed(2);
  }, [data]);

  const ratingDistribution = useMemo(() => {
    const distribution = [
      { name: '5 Stars', count: 0 },
      { name: '4-4.9 Stars', count: 0 },
      { name: '3-3.9 Stars', count: 0 },
      { name: '2-2.9 Stars', count: 0 },
      { name: '1-1.9 Stars', count: 0 },
    ];
    data.forEach(item => {
      if (item.rating >= 5) distribution[0].count++;
      else if (item.rating >= 4) distribution[1].count++;
      else if (item.rating >= 3) distribution[2].count++;
      else if (item.rating >= 2) distribution[3].count++;
      else if (item.rating >= 1) distribution[4].count++;
    });
    return distribution;
  }, [data]);


  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* --- Left Sidebar: Input & Controls --- */}
      <aside className="w-full max-w-sm p-8 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-cyan-400">Data Scraper</h1>
          <p className="text-gray-400 mt-2">Google Maps Business Data</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
          <div>
            <label htmlFor="query" className="block text-sm font-semibold text-gray-300 mb-2">
              Search Query
            </label>
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              placeholder="e.g., cafes in Chennai"
              required
            />
          </div>
          
          <div className="flex-grow"></div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </button>
        </form>
        
        {message && (
          <div className={`p-4 mt-6 text-center text-sm rounded-md ${message.startsWith('Error') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
            {message}
          </div>
        )}
      </aside>

      {/* --- Right Panel: Dashboard Display --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading && <div className="text-center text-gray-400">Loading data...</div>}
        
        {!loading && data.length === 0 && !message && (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            <div>
              <h2 className="text-2xl font-semibold">Welcome</h2>
              <p>Enter a search query on the left to begin scraping.</p>
            </div>
          </div>
        )}

        {!loading && data.length > 0 && (
          <div className="space-y-8">
            {/* --- Summary Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium">Total Businesses Found</h3>
                <p className="text-3xl font-bold mt-2">{data.length}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium">Average Rating</h3>
                <p className="text-3xl font-bold mt-2 flex items-center"><IconStar /> {averageRating}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-sm font-medium">Total Reviews Scraped</h3>
                <p className="text-3xl font-bold mt-2">{data.reduce((sum, item) => sum + (item.reviews || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            {/* --- Chart --- */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                  <YAxis stroke="#A0AEC0" fontSize={12} />
                  <Tooltip cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4A5568' }} />
                  <Bar dataKey="count" fill="#2DD4BF" name="Number of Businesses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* --- Data Table --- */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Scraped Data</h3>
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-1/2 mt-4 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-700/50 text-xs text-gray-400 uppercase">
                    <tr>
                      <th scope="col" className="px-6 py-3">Name</th>
                      <th scope="col" className="px-6 py-3">Category</th>
                      <th scope="col" className="px-6 py-3">Rating</th>
                      <th scope="col" className="px-6 py-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                        <td className="px-6 py-4">{item.category}</td>
                        <td className="px-6 py-4"><span className="flex items-center"><IconStar /> {item.rating} ({item.reviews.toLocaleString()})</span></td>
                        <td className="px-6 py-4 text-gray-300">
                          {item.website !== 'N/A' && <a href={item.website} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 flex items-center mb-1"><IconGlobe />Website</a>}
                          {item.phone !== 'N/A' && <span className="flex items-center"><IconPhone />{item.phone}</span>}
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
