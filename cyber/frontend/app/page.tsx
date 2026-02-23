'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Shield, Activity, Globe, TrendingUp, AlertTriangle, Lock, Zap, Eye, Brain, Database, MapPin, Clock, Target } from 'lucide-react';

interface Analytics {
  accuracy: number;
  f1_score: number;
  total_incidents: number;
  duplicate_count: number;
  severity_risk_chart?: Array<{ severity: string; avg_risk: number }>;
  severity_distribution?: Record<string, number>;
}

interface Incident {
  _id: string;
  region: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  timestamp: string;
  risk_score: number;
  ip_address: string;
}

export default function LandingPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // Animated grid background
  useEffect(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        particles.forEach((p2, j) => {
          if (i === j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch data
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
      console.error('Error fetching data:', err);
      setIsLoading(false);
    });
  }, []);

  const severityColors = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e'
  };

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <main className="relative min-h-screen bg-black text-gray-100 font-sans overflow-x-hidden">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* HERO SECTION */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative flex flex-col items-center justify-center text-center min-h-screen px-6"
      >
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="mb-8 mx-auto w-24 h-24 relative"
          >
            <Shield className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-2 border-cyan-400/30 rounded-full"
            />
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
           CyberShield
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed">
            Next-Generation Threat Intelligence Platform
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Cyber-Crime pattern recognition • Global threat mapping
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6,182,212,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-lg overflow-hidden cursor-pointer inline-block"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Launch Dashboard
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>

            <motion.button
              onClick={() => {
                const section = document.querySelector('#analytics-section');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl font-semibold text-lg hover:border-cyan-500 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                View Analytics
              </span>
            </motion.button>
          </div>

          {/* Stats ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-8 justify-center text-sm"
          >
            {[
              { label: 'Threats Analyzed', value: '1.2M+', icon: Database },
              { label: 'Detection Speed', value: '<50ms', icon: Zap },
              { label: 'Global Coverage', value: '195+', icon: Globe },
              { label: 'Accuracy Rate', value: '99.2%', icon: Target }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex items-center gap-2 text-gray-400"
              >
                <stat.icon className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-bold">{stat.value}</span>
                <span>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-cyan-400/50 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* ANALYTICS SECTION */}
      <section id="analytics-section" className="relative py-24 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Cyber Threat Insights
            </h2>
            <p className="text-gray-400 text-lg"> Global Threat Watch</p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
              />
            </div>
          ) : analytics ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {[
                  { 
                    title: 'Model Accuracy', 
                    value: `${analytics.accuracy}%`, 
                    icon: Target,
                    color: 'from-cyan-500 to-blue-600',
                    change: '+2.3%'
                  },
                  { 
                    title: 'F1 Score', 
                    value: analytics.f1_score, 
                    icon: Activity,
                    color: 'from-green-500 to-emerald-600',
                    change: '+0.12'
                  },
                  { 
                    title: 'Total Incidents', 
                    value: analytics.total_incidents, 
                    icon: AlertTriangle,
                    color: 'from-yellow-500 to-orange-600',
                    change: '+47'
                  },
                  { 
                    title: 'Duplicates Detected', 
                    value: analytics.duplicate_count, 
                    icon: Database,
                    color: 'from-red-500 to-pink-600',
                    change: '-12'
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50 hover:border-cyan-500/50 transition-all overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <stat.icon className="w-8 h-8 text-cyan-400" />
                        <span className="text-xs font-semibold text-green-400">{stat.change}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
                      <p className="text-4xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                {/* Severity Distribution */}
                {analytics.severity_risk_chart && (
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart className="w-6 h-6 text-cyan-400" />
                      <h3 className="text-2xl font-bold">Severity Analysis</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.severity_risk_chart}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="severity" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="avg_risk" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Severity Distribution Pie */}
                {analytics.severity_distribution && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <PieChart className="w-6 h-6 text-cyan-400" />
                      <h3 className="text-2xl font-bold">Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analytics.severity_distribution).map(([key, value]) => ({
                            name: key,
                            value: value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(analytics.severity_distribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* INCIDENT FEED */}
      <section id="incidents-section" className="relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Cyber Crime Incident Stream
            </h2>
            <p className="text-gray-400 text-lg">Cyber-Crime threat detection across the globe</p>
          </motion.div>

          <div className="grid gap-4 max-w-5xl mx-auto">
            <AnimatePresence>
              {incidents.slice(0, 8).map((incident, i) => (
                <motion.div
                  key={incident._id}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="group relative bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-xl p-6 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all overflow-hidden"
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: severityColors[incident.severity] }}
                  />
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-300 font-semibold">{incident.region}</span>
                        <span 
                          className="px-3 py-1 text-xs font-bold rounded-full"
                          style={{ 
                            backgroundColor: severityColors[incident.severity] + '20',
                            color: severityColors[incident.severity]
                          }}
                        >
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3 line-clamp-2">{incident.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(incident.timestamp).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Risk: {incident.risk_score}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {incident.ip_address}
                        </span>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                    >
                      <Eye className="w-5 h-5 text-cyan-400" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* AI INSIGHTS */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20" />
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 bg-[length:200%_100%]"
        />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Brain className="w-20 h-20 mx-auto mb-6 text-cyan-400" />
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Data Driven Insights
            </h2>
            <p className="text-xl text-gray-200 mb-4">
              Data analytics identifies emerging threats before they escalate.

            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-full mb-8">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-semibold">
                Potential surge in Critical Threats detected in Asia Pacific
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.a
                href="/dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all cursor-pointer inline-block"
              >
                View Full Dashboard
              </motion.a>
              <motion.button
                onClick={() => {
                  const section = document.querySelector('#incidents-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-gray-900 transition-all cursor-pointer"
              >
                View Incidents
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-12 px-6 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold">CyberShield</span>
            </div>
            
            <p className="text-gray-500 text-sm">
              © 2024 Built with <span className="text-cyan-400 font-semibold">❤️</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}