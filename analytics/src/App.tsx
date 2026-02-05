import React, { useState } from 'react';
import useSWR from 'swr';
import {
  fetchStats
} from './lib/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Activity,
  Clock,
  Code,
  Cpu,
  Globe,
  Layout,
  Key,
  RefreshCw,
  LogOut,
  Zap
} from 'lucide-react';
import { cn } from '@workspace/client/lib/utils';

const App = () => {
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('devmeter_admin_secret') || '');
  const [tempSecret, setTempSecret] = useState('');
  const [isSetup, setIsSetup] = useState(!!adminSecret);

  const { data, error, isLoading, mutate } = useSWR(
    isSetup ? [adminSecret, 'metrics'] : null,
    ([secret]) => fetchStats(secret),
    { refreshInterval: 30000 }
  );

  const handleSaveSecret = () => {
    if (tempSecret.trim()) {
      localStorage.setItem('devmeter_admin_secret', tempSecret);
      setAdminSecret(tempSecret);
      setIsSetup(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devmeter_admin_secret');
    setAdminSecret('');
    setIsSetup(false);
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#030712] text-white">
        <div className="max-w-md w-full p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
              <Cpu size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">DevMeter Admin</h1>
          <p className="text-gray-400 text-center mb-8">Enter the Admin Secret to monitor system performance</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Admin Secret</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={tempSecret}
                  onChange={(e) => setTempSecret(e.target.value)}
                  placeholder="Enter secret..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSaveSecret}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Access Dashboard
            </button>
          </div>

          <p className="mt-8 text-xs text-center text-gray-500 italic">
            Internal developers only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              System Performance Monitor
            </h1>
            <p className="text-gray-400">Aggregated DevMeter API traffic and ecosystem health</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border animate-pulse",
              data?.summary.isSystemOnline ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              <span className={cn("w-2 h-2 rounded-full", data?.summary.isSystemOnline ? "bg-emerald-500" : "bg-red-500")} />
              {data?.summary.isSystemOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
            </div>
            <button
              onClick={() => mutate()}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={cn("w-5 h-5 text-gray-400", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 group transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error.message || "Failed to fetch system metrics."}
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total API Volume"
            value={data?.summary.totalRequests.toLocaleString() || '0'}
            subValue="All-time requests"
            icon={<Activity className="text-blue-400" />}
            color="blue"
          />
          <StatCard
            title="System Load"
            value={`${data?.summary.systemLoad || '0.00'} RPM`}
            subValue="Requests per minute"
            icon={<Clock className="text-purple-400" />}
            color="purple"
          />
          <StatCard
            title="Active Users"
            value={data?.summary.activeUsers.toLocaleString() || '0'}
            subValue="Sent heartbeats (7d)"
            icon={<Globe className="text-orange-400" />}
            color="orange"
          />
          <StatCard
            title="Traffic Growth"
            value={`${data?.summary.growth || 0}%`}
            subValue="vs previous 24h"
            icon={<Zap className="text-yellow-400" />}
            color="yellow"
            trend={data?.summary.growth ? (data.summary.growth > 0 ? 'up' : 'down') : undefined}
          />
        </div>

        {/* Extended Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="System Uptime"
            value={data?.summary.uptime || '99.9%'}
            subValue="Availability"
            icon={<Activity className="text-emerald-400" />}
            color="blue"
          />
          <StatCard
            title="Avg Response Time"
            value={data?.summary.avgResponseTime || '145ms'}
            subValue="Latency"
            icon={<Clock className="text-cyan-400" />}
            color="purple"
          />
          <StatCard
            title="Error Rate"
            value={`${data?.summary.errorRate || 0}%`}
            subValue="Failed requests"
            icon={<Zap className="text-red-400" />}
            color="orange"
            trend={data?.summary.errorRate ? (data.summary.errorRate > 1 ? 'down' : 'up') : undefined}
          />
          <StatCard
            title="New Users"
            value={data?.summary.newUsersThisWeek?.toLocaleString() || '0'}
            subValue="This week"
            icon={<Globe className="text-indigo-400" />}
            color="yellow"
            trend={data?.summary.newUsersThisWeek ? 'up' : undefined}
          />
        </div>

        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Heartbeats"
            value={data?.summary.totalHeartbeats?.toLocaleString() || '0'}
            subValue="All-time activity"
            icon={<Activity className="text-pink-400" />}
            color="blue"
          />
          <StatCard
            title="Retention Rate"
            value={`${data?.summary.retentionRate || 0}%`}
            subValue="User retention"
            icon={<Clock className="text-teal-400" />}
            color="purple"
            trend={data?.summary.retentionRate ? (data.summary.retentionRate > 50 ? 'up' : 'down') : undefined}
          />
          <StatCard
            title="Active Projects"
            value={data?.summary.activeProjects?.toLocaleString() || '0'}
            subValue="Tracked projects"
            icon={<Layout className="text-blue-300" />}
            color="orange"
          />
          <StatCard
            title="Peak Traffic Time"
            value={data?.summary.peakTrafficTime || '--:--'}
            subValue="UTC timezone"
            icon={<Zap className="text-amber-400" />}
            color="yellow"
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Over Time */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              API Traffic Distribution
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.activityByDay || []}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Summary */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Cpu size={20} className="text-cyan-400" />
              System Health
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Uptime</span>
                  <span className="text-sm font-semibold text-emerald-400">{data?.summary.uptime || '99.9%'}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Error Rate</span>
                  <span className={`text-sm font-semibold ${data?.summary.errorRate && data.summary.errorRate > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {data?.summary.errorRate || 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${data?.summary.errorRate || 0}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Response Time</span>
                  <span className="text-sm font-semibold text-cyan-400">{data?.summary.avgResponseTime || '145ms'}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-500">Peak Traffic: <span className="text-white">{data?.summary.peakTrafficTime || '--:--'} UTC</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Language Breakdown */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Code size={20} className="text-emerald-400" />
              Ecosystem Language Context
            </h3>
            <div className="h-[250px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.languages || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.languages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-3">
                {data?.languages.map((l) => (
                  <div key={l.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-sm text-gray-300 truncate">{l.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{l.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Ecosystem Projects */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Layout size={20} className="text-purple-400" />
              Top Ecosystem Projects
            </h3>
            <div className="space-y-4">
              {data?.projects.map((p, i) => (
                <div key={p.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">{p.name}</span>
                    <span className="text-gray-400 text-xs">{p.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${p.value}%`, opacity: 1 - i * 0.15 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{p.requests.toLocaleString()} requests</p>
                </div>
              ))}
              {(!data || data.projects.length === 0) && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 italic">
                  No ecosystem data available
                </div>
              )}
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              User Engagement
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-300">New Users (7d)</span>
                  <span className="text-lg font-bold text-indigo-400">{data?.summary.newUsersThisWeek?.toLocaleString() || '0'}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-300">Retention Rate</span>
                  <span className="text-lg font-bold text-emerald-400">{data?.summary.retentionRate || 0}%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Total Heartbeats</p>
                <p className="text-2xl font-bold text-cyan-400">{data?.summary.totalHeartbeats?.toLocaleString() || '0'}</p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500">Top Endpoint: <span className="text-white font-mono text-xs">{data?.summary.topEndpoint || '/api/heartbeat'}</span></p>
              </div>
            </div>
          </div>
        </div>

        <footer className="pt-8 pb-4 text-center text-gray-600 text-sm border-t border-white/5">
          DevMeter Developer Monitor &copy; {new Date().getFullYear()} • premium system insights
        </footer>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange' | 'yellow';
  trend?: 'up' | 'down';
}

const StatCard = ({ title, value, subValue, icon, color, trend }: StatCardProps) => {
  const colorMap = {
    blue: 'hover:border-blue-500/50',
    purple: 'hover:border-purple-500/50',
    orange: 'hover:border-orange-500/50',
    yellow: 'hover:border-yellow-500/50',
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300",
      colorMap[color]
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-xl bg-white/5 backdrop-blur-md">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-lg",
            trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold mb-1 tracking-tight">{value}</h4>
        <p className="text-xs text-gray-400">{subValue}</p>
      </div>
    </div>
  );
};

export default App;
