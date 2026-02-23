'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Shield, Brain, Clock, Map, Filter, Download, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('risk');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('http://127.0.0.1:5000/analytics').then(r => r.json()),
      fetch('http://127.0.0.1:5000/incidents').then(r => r.json())
    ]).then(([analyticsData, incidentsData]) => {
      setAnalytics(analyticsData);
      setIncidents(incidentsData);
      setIsLoading(false);
    }).catch(err => {
      console.error('Error:', err);
      setIsLoading(false);
    });
  }, []);

  // Process data for visualizations
  const getTimeSeriesData = () => {
    if (!incidents.length) return [];
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        incidents: Math.floor(Math.random() * 50) + 20,
        threats: Math.floor(Math.random() * 30) + 10,
        blocked: Math.floor(Math.random() * 40) + 15
      };
    });
    return last7Days;
  };

  const getRegionData = () => {
    const regionMap = {};
    incidents.forEach(inc => {
      if (!regionMap[inc.region]) {
        regionMap[inc.region] = { region: inc.region, count: 0, avgRisk: 0, totalRisk: 0 };
      }
      regionMap[inc.region].count++;
      regionMap[inc.region].totalRisk += inc.risk_score;
    });
    return Object.values(regionMap).map(r => ({
      ...r,
      avgRisk: Math.round(r.totalRisk / r.count)
    }));
  };

  const getThreatTypeData = () => {
    const types = ['Malware', 'Phishing', 'DDoS', 'Ransomware', 'Data Breach', 'SQL Injection'];
    return types.map(type => ({
      type,
      value: Math.floor(Math.random() * 100) + 20,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  };

  const getRiskRadarData = () => [
    { category: 'Malware', value: 85 },
    { category: 'Phishing', value: 72 },
    { category: 'DDoS', value: 68 },
    { category: 'Ransomware', value: 91 },
    { category: 'Data Breach', value: 78 },
    { category: 'Insider', value: 54 }
  ];

  const timeSeriesData = getTimeSeriesData();
  const regionData = getRegionData();
  const threatTypeData = getThreatTypeData();
  const radarData = getRiskRadarData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.a
                href="/"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.a>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Advanced Analytics
                </h1>
                <p className="text-sm text-gray-400">Deep dive into threat intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg bg-gray-800 hover:bg-cyan-600 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { 
                label: 'Total Threats Detected',
                value: analytics?.total_incidents || 0,
                change: '+12.5%',
                trend: 'up',
                icon: Shield,
                color: 'from-red-500 to-orange-600'
              },
              { 
                label: 'Average Risk Score',
                value: incidents.length ? Math.round(incidents.reduce((sum, i) => sum + i.risk_score, 0) / incidents.length) : 0,
                change: '-3.2%',
                trend: 'down',
                icon: Activity,
                color: 'from-cyan-500 to-blue-600'
              },
              { 
                label: 'Critical Incidents',
                value: incidents.filter(i => i.severity === 'Critical').length,
                change: '+8.1%',
                trend: 'up',
                icon: AlertTriangle,
                color: 'from-yellow-500 to-orange-600'
              },
              { 
                label: 'Model Accuracy',
                value: `${analytics?.accuracy || 0}%`,
                change: '+2.3%',
                trend: 'up',
                icon: Brain,
                color: 'from-green-500 to-emerald-600'
              }
            ].map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50 hover:border-cyan-500/50 transition-all overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <metric.icon className="w-8 h-8 text-cyan-400" />
                    <div className={`flex items-center gap-1 text-xs font-bold ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {metric.change}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{metric.label}</p>
                  <p className="text-3xl font-black text-white">{metric.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Time Series Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Threat Timeline</h2>
                <p className="text-gray-400 text-sm">Incident trends over time</p>
              </div>
              <div className="flex gap-2">
                {['incidents', 'threats', 'blocked'].map(metric => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      selectedMetric === metric 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  fill="url(#areaGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Regional Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Regional Analysis</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="vertical">
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis type="category" dataKey="region" stroke="#6b7280" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Threat Type Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Threat Categories</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={threatTypeData}>
                  <XAxis dataKey="type" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {threatTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Risk Radar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Risk Assessment</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="category" stroke="#6b7280" />
                  <PolarRadiusAxis stroke="#6b7280" />
                  <Radar 
                    dataKey="value" 
                    stroke="#06b6d4" 
                    fill="#06b6d4" 
                    fillOpacity={0.5} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Severity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-cyan-400" />
                <h3 className="text-2xl font-bold">Severity Trends</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="incidents" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="threats" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blocked" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Top Threats Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
          >
            <h3 className="text-2xl font-bold mb-6">High Priority Threats</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Region</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Severity</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Risk Score</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 10).map((incident, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-cyan-300">{incident.region}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          incident.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          incident.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                          incident.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">{incident.risk_score}</td>
                      <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{incident.description}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(incident.timestamp).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}