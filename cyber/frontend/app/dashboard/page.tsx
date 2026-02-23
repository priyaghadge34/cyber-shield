'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  const COLORS: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  };

  useEffect(() => {
    const fetchData = async () => {
      const [aRes, iRes] = await Promise.all([
        axios.get('http://127.0.0.1:5000/analytics'),
        axios.get('http://127.0.0.1:5000/incidents'),
      ]);
      setAnalytics(aRes.data);
      setIncidents(iRes.data);
    };
    fetchData();
  }, []);

  const pieData = analytics
    ? Object.entries(analytics.severity_distribution).map(([key, value]) => ({ name: key, value }))
    : [];

  const barData = analytics?.severity_risk_chart || [];

  const lineData = (() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i) => {
      const date = new Date(i.timestamp).toLocaleDateString();
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  })();

  const regionCounts: Record<string, number> = {};
  incidents.forEach((i) => {
    regionCounts[i.region] = (regionCounts[i.region] || 0) + 1;
  });

  const colorScale = scaleLinear<string>()
    .domain([0, Math.max(...Object.values(regionCounts), 1)])
    .range(['#0f172a', '#00ffff']);

  // --- Filters ---
  const handlePieClick = (entry: any) => {
    const name = entry?.name;
    if (!name) return;
    setSelectedSeverity((prev) => (prev === name ? null : name));
    setSelectedRegion(null); // clear region filter
  };

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion((prev) => (prev === regionName ? null : regionName));
    setSelectedSeverity(null); // clear severity filter
  };

  const filteredIncidents = incidents.filter((i) => {
    const region = (i.region || '').toLowerCase().trim();
    const severity = (i.severity || '').toLowerCase().trim();

    if (selectedRegion && selectedSeverity) {
      return (
        region === selectedRegion.toLowerCase().trim() &&
        severity === selectedSeverity.toLowerCase().trim()
      );
    } else if (selectedRegion) {
      return region === selectedRegion.toLowerCase().trim();
    } else if (selectedSeverity) {
      return severity === selectedSeverity.toLowerCase().trim();
    }
    return false;
  });

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-gray-100 p-6">
      {/* Neon background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0,transparent_70%)]" />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-extrabold text-cyan-400 text-center mb-12 drop-shadow-[0_0_10px_#00ffff]"
      >
        Cybercrime Analytics Dashboard 🌐
      </motion.h1>

      {/* Analytics Summary */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto mb-8 bg-gray-800/70 border border-cyan-500/40 p-4 rounded-2xl text-center"
        >
          <p className="text-cyan-300 font-semibold">
            🧠 {analytics.total_incidents} total incidents analyzed — accuracy {analytics.accuracy}% | F1 score {analytics.f1_score}
          </p>
        </motion.div>
      )}

      {/* PIE + BAR CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Pie Chart */}
<div className="bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
  <h2 className="text-xl font-semibold text-center mb-4 text-cyan-300 drop-shadow-[0_0_8px_#00ffff]">
    Severity Overview
  </h2>

  <ResponsiveContainer width="100%" height={400}>
    <PieChart>
      <Pie
        data={pieData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={130}
        innerRadius={60}
        paddingAngle={4}
        onClick={(d) => handlePieClick(d)}
        labelLine={true}
        label={({ name, percent, value }) =>
          `${name}: ${value} (${((percent ?? 0) * 100).toFixed(1)}%)`
        }
        animationBegin={200}
        animationDuration={800}
      >
        {pieData.map((entry, i) => (
          <Cell
            key={i}
            fill={COLORS[entry.name] || '#00ffff'}
            opacity={selectedSeverity === entry.name ? 1 : 0.7}
            stroke={selectedSeverity === entry.name ? '#00ffff' : '#0f172a'}
            strokeWidth={selectedSeverity === entry.name ? 4 : 1}
            style={{
              filter:
                selectedSeverity === entry.name
                  ? 'drop-shadow(0 0 10px #00ffff)'
                  : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
            }}
          />
        ))}
      </Pie>

      <Tooltip
        contentStyle={{
          backgroundColor: '#0f172a',
          border: '1px solid #00ffff',
          borderRadius: '10px',
          color: '#e0f2fe',
          fontWeight: 600,
        }}
        labelStyle={{ color: '#00ffff' }}
      />
    </PieChart>
  </ResponsiveContainer>

  <div className="text-center mt-4 text-gray-400 text-sm">
    Click on any segment to explore incidents by severity 🔍
  </div>
</div>

        {/* Bar Chart */}
<div className="bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-cyan-500/20">
  <h2 className="text-xl font-semibold text-center mb-4 text-cyan-300">
    Average Risk by Severity
  </h2>
  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={barData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
      <XAxis
        dataKey="severity"
        stroke="#00ffff"
        tick={{ fill: '#00ffff', fontSize: 14, fontWeight: 600 }}
      />
      <YAxis
        stroke="#00ffff"
        tick={{ fill: '#00ffff', fontSize: 12 }}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: '#0f172a',
          border: '1px solid #00ffff',
          borderRadius: '8px',
          color: '#e0f2fe',
        }}
      />
      <Legend
        wrapperStyle={{
          color: '#00ffff',
          fontWeight: 600,
          fontSize: 13,
        }}
      />
      <Bar dataKey="avg_risk" fill="#00ffff" />
    </BarChart>
  </ResponsiveContainer>
</div>
</div>


     {/* Line Chart */}
<div className="bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-cyan-500/20 mb-12">
  <h2 className="text-xl font-semibold text-center mb-4 text-cyan-300">
    Incident Trend (90 Days)
  </h2>

  <ResponsiveContainer width="100%" height={350}>
    <LineChart data={lineData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /> {/* Softer grid for contrast */}
      <XAxis
        dataKey="date"
        stroke="#00ffff"
        tick={{ fill: '#00ffff', fontSize: 13, fontWeight: 600 }}
      />
      <YAxis
        stroke="#00ffff"
        tick={{ fill: '#00ffff', fontSize: 12 }}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: '#0f172a',
          border: '1px solid #00ffff',
          borderRadius: '8px',
          color: '#e0f2fe',
        }}
        labelStyle={{
          color: '#00ffff',
          fontWeight: 600,
        }}
      />
      <Legend
        wrapperStyle={{
          color: '#00ffff',
          fontWeight: 600,
          fontSize: 13,
        }}
      />
      <Line
        type="monotone"
        dataKey="count"
        stroke="#00ffff"
        strokeWidth={3}
        dot={{ fill: '#00ffff', r: 4 }}
        activeDot={{ r: 6, fill: '#0ff', stroke: '#fff' }}
      />
    </LineChart>
  </ResponsiveContainer>

  <p className="text-sm text-gray-400 text-center mt-2">
    Displays the number of cyber incidents recorded per day over the past 90 days.
  </p>
</div>

      {/* Map Replacement (Simple Regions Visualization) */}
      <div className="w-full flex flex-col items-center justify-center bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-cyan-500/20 mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-6 text-cyan-300">Global Hotspot Map</h2>

        <div className="flex justify-center text-black items-center w-full overflow-x-auto">
          <svg viewBox="0 0 800 360" className="w-[90%] max-w-5xl h-auto">
            {[
              { x: 40, y: 40, w: 200, h: 110, name: 'North America' },
              { x: 260, y: 170, w: 140, h: 120, name: 'South America' },
              { x: 320, y: 40, w: 160, h: 90, name: 'Europe' },
              { x: 500, y: 120, w: 120, h: 80, name: 'Middle East' },
              { x: 420, y: 200, w: 160, h: 110, name: 'Africa' },
              { x: 600, y: 60, w: 160, h: 140, name: 'Asia Pacific' },
            ].map((region, i) => (
              <g key={i} onClick={() => handleRegionClick(region.name)} style={{ cursor: 'pointer' }}>
                <rect
                  x={region.x}
                  y={region.y}
                  width={region.w}
                  height={region.h}
                  rx="8"
                  ry="8"
                  fill={colorScale(regionCounts[region.name] || 0)}
                  stroke={selectedRegion === region.name ? '#00ffff' : '#0f172a'}
                  strokeWidth={selectedRegion === region.name ? 4 : 1}
                />
                <text
                  x={region.x + region.w / 2}
                  y={region.y + region.h / 2}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#000000ff"
                >
                  {region.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <p className="text-gray-400 text-sm mt-3">
          Click on a region or pie category to explore cyber activity 🌍
        </p>
      </div>

      {/* Filter Info */}
      {(selectedRegion || selectedSeverity) && (
        <div className="text-center mb-4 text-cyan-300">
          Showing{' '}
          {selectedRegion && <span className="font-bold text-white">{selectedRegion}</span>}
          {selectedRegion && selectedSeverity && ' — '}
          {selectedSeverity && <span className="font-bold text-white">{selectedSeverity}</span>} incidents
        </div>
      )}

      {/* Incident Cards */}
      {(selectedRegion || selectedSeverity) && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-cyan-500/20 max-w-6xl mx-auto"
        >
          <div className="grid md:grid-cols-2 gap-4">
            {filteredIncidents.slice(0, 12).map((i, idx) => (
              <motion.div
                key={i._id || idx}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-cyan-400/40 transition-all"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">{i.region}</span>
                  <span className="text-sm text-cyan-400">Risk: {i.risk_score}</span>
                </div>
                <p className="text-gray-300 text-sm">{i.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </main>
  );
}
