'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, Activity, AlertTriangle, TrendingUp, Filter, Search, ArrowLeft, Zap, Shield } from 'lucide-react';

export default function ThreatMapPage() {
  const [incidents, setIncidents] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('http://127.0.0.1:5000/incidents').then(r => r.json()),
      fetch('http://127.0.0.1:5000/hotspots').then(r => r.json())
    ]).then(([incidentsData, hotspotsData]) => {
      setIncidents(incidentsData);
      setHotspots(hotspotsData);
      setIsLoading(false);
    }).catch(err => {
      console.error('Error:', err);
      setIsLoading(false);
    });
  }, []);

  const regionCoordinates = {
    'North America': { x: 20, y: 35 },
    'South America': { x: 30, y: 65 },
    'Europe': { x: 50, y: 30 },
    'Africa': { x: 52, y: 55 },
    'Asia Pacific': { x: 75, y: 40 },
    'Middle East': { x: 58, y: 42 }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchesSearch = inc.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': '#ef4444',
      'High': '#f97316',
      'Medium': '#eab308',
      'Low': '#22c55e'
    };
    return colors[severity] || '#6b7280';
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

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
                  Global Threat Map
                </h1>
                <p className="text-sm text-gray-400">Real-time cybercrime monitoring worldwide</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
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
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Threats', value: filteredIncidents.length, icon: AlertTriangle, color: 'text-red-400' },
              { label: 'Hotspot Regions', value: hotspots.length, icon: MapPin, color: 'text-orange-400' },
              { label: 'Critical Events', value: filteredIncidents.filter(i => i.severity === 'Critical').length, icon: Zap, color: 'text-yellow-400' },
              { label: 'Countries Monitored', value: '195+', icon: Globe, color: 'text-cyan-400' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-4 rounded-xl border border-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Interactive Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold">Threat Distribution</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-400">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-400">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-400">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-400">Low</span>
                  </div>
                </div>
              </div>

              {/* World Map Visualization */}
              <div className="relative w-full h-[500px] bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700/30">
                {/* Grid background */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />

                {/* Continents outline (simplified) */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* North America */}
                  <path d="M15,25 L25,20 L35,25 L30,40 L20,45 Z" fill="#06b6d4" stroke="#06b6d4" strokeWidth="0.2" />
                  {/* South America */}
                  <path d="M28,50 L35,55 L32,70 L25,75 L22,65 Z" fill="#06b6d4" stroke="#06b6d4" strokeWidth="0.2" />
                  {/* Europe */}
                  <path d="M45,20 L55,18 L58,28 L52,35 L45,30 Z" fill="#06b6d4" stroke="#06b6d4" strokeWidth="0.2" />
                  {/* Africa */}
                  <path d="M48,38 L58,40 L60,55 L55,65 L48,60 Z" fill="#06b6d4" stroke="#06b6d4" strokeWidth="0.2" />
                  {/* Asia */}
                  <path d="M62,20 L80,22 L85,35 L75,45 L65,40 Z" fill="#06b6d4" stroke="#06b6d4" strokeWidth="0.2" />
                  {/* Australia */}
                  <path d="M75,55 L82,58 L80,65 L73,63 Z" fill="#06b6d4" stroke="#06b6d4" strokeWidth="0.2" />
                </svg>

                {/* Threat markers */}
                {hotspots.map((hotspot, i) => {
                  const coords = regionCoordinates[hotspot.region];
                  if (!coords) return null;

                  const riskLevel = getRiskLevel(hotspot.risk_score);
                  const color = getSeverityColor(riskLevel);
                  const size = 20 + (hotspot.incident_count * 2);

                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      style={{
                        position: 'absolute',
                        left: `${coords.x}%`,
                        top: `${coords.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className="cursor-pointer group"
                      onClick={() => setSelectedRegion(hotspot)}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: color,
                          filter: 'blur(8px)',
                          opacity: 0.5
                        }}
                      />
                      <div
                        className="relative rounded-full flex items-center justify-center font-bold text-xs border-2 border-white/50 group-hover:border-white transition-all"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: color,
                          boxShadow: `0 0 20px ${color}`
                        }}
                      >
                        {hotspot.incident_count}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs">
                          <p className="font-bold text-cyan-400">{hotspot.region}</p>
                          <p className="text-gray-400">Incidents: {hotspot.incident_count}</p>
                          <p className="text-gray-400">Risk: {hotspot.risk_score}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Connecting lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {hotspots.map((hotspot, i) => {
                    if (i === 0) return null;
                    const coords1 = regionCoordinates[hotspots[i - 1].region];
                    const coords2 = regionCoordinates[hotspot.region];
                    if (!coords1 || !coords2) return null;

                    return (
                      <motion.line
                        key={i}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.3 }}
                        transition={{ delay: i * 0.2, duration: 1 }}
                        x1={`${coords1.x}%`}
                        y1={`${coords1.y}%`}
                        x2={`${coords2.x}%`}
                        y2={`${coords2.y}%`}
                        stroke="#06b6d4"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>
              </div>
            </motion.div>

            {/* Region Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold">Regional Hotspots</h2>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {hotspots.map((hotspot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedRegion(hotspot)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedRegion?.region === hotspot.region
                          ? 'bg-cyan-600/20 border-2 border-cyan-500'
                          : 'bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-cyan-300">{hotspot.region}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          getRiskLevel(hotspot.risk_score) === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          getRiskLevel(hotspot.risk_score) === 'High' ? 'bg-orange-500/20 text-orange-400' :
                          getRiskLevel(hotspot.risk_score) === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {getRiskLevel(hotspot.risk_score)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Incidents</p>
                          <p className="font-bold">{hotspot.incident_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Risk Score</p>
                          <p className="font-bold">{hotspot.risk_score}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${hotspot.risk_score}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: getSeverityColor(getRiskLevel(hotspot.risk_score))
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold">
                Live Incidents
                {selectedRegion && ` - ${selectedRegion.region}`}
              </h2>
            </div>

            <div className="grid gap-3">
              {(selectedRegion 
                ? filteredIncidents.filter(i => i.region === selectedRegion.region)
                : filteredIncidents
              ).slice(0, 10).map((incident, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all"
                >
                  <div
                    className="w-2 h-12 rounded-full"
                    style={{ backgroundColor: getSeverityColor(incident.severity) }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-cyan-300 font-semibold">{incident.region}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        incident.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        incident.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        incident.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {incident.severity}
                      </span>
                      <span className="text-gray-500 text-xs">{incident.ip_address}</span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-1">{incident.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">Risk: {incident.risk_score}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(incident.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}