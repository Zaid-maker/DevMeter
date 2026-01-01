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
  Flame,
  Globe,
  Layout,
  Key,
  RefreshCw,
  LogOut,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('devmeter_api_key') || '');
  const [tempKey, setTempKey] = useState('');
  const [isSetup, setIsSetup] = useState(!!apiKey);

  const { data, error, isLoading, mutate } = useSWR(
    isSetup ? [apiKey, 'stats'] : null,
    ([key]) => fetchStats(key),
    { refreshInterval: 60000 }
  );

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('devmeter_api_key', tempKey);
      setApiKey(tempKey);
      setIsSetup(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devmeter_api_key');
    setApiKey('');
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
          <h1 className="text-3xl font-bold text-center mb-2">DevMeter API Analytics</h1>
          <p className="text-gray-400 text-center mb-8">Enter your API key to connect your Developer Dashboard</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste your key here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSaveKey}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Get Started
            </button>
          </div>

          <p className="mt-8 text-xs text-center text-gray-500">
            You can find your API key in the DevMeter settings page.
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
              API Analytics Dashboard
            </h1>
            <p className="text-gray-400">Monitoring DevMeter API usage and coding performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border animate-pulse",
              data?.summary.isLive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-gray-500/10 border-gray-500/20 text-gray-400"
            )}>
              <span className={cn("w-2 h-2 rounded-full", data?.summary.isLive ? "bg-emerald-500" : "bg-gray-500")} />
              {data?.summary.isLive ? 'ACTIVE NOW' : 'OFFLINE'}
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
            Failed to fetch analytics data. Please check your API key or ensure the DevMeter app is running.
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total API Requests"
            value={data?.summary.totalTime || '0h 0m'}
            subValue="Volume accumulated"
            icon={<Activity className="text-blue-400" />}
            color="blue"
          />
          <StatCard
            title="Avg. Request Duration"
            value={data?.summary.dailyAverage || '0h'}
            subValue="Per active day"
            icon={<Clock className="text-purple-400" />}
            color="purple"
          />
          <StatCard
            title="Current Streak"
            value={data?.summary.currentStreak?.toString() || '0'}
            subValue="Consecutive days"
            icon={<Flame className="text-orange-400" />}
            color="orange"
          />
          <StatCard
            title="Growth Rate"
            value={`${data?.summary.percentGrowth || 0}%`}
            subValue="From previous week"
            icon={<Zap className="text-yellow-400" />}
            color="yellow"
            trend={data?.summary.percentGrowth ? (data.summary.percentGrowth > 0 ? 'up' : 'down') : undefined}
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Over Time */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              API activity over time
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
                    tickFormatter={(value) => `${value}h`}
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

          {/* Top Systems */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Globe size={20} className="text-purple-400" />
              API Consumers
            </h3>
            <div className="space-y-6">
              {data?.projects.slice(0, 4).map((p, i) => (
                <div key={p.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">{p.name}</span>
                    <span className="text-gray-400">{p.hours}h ({p.value}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${p.value}%`, opacity: 1 - i * 0.15 }}
                    />
                  </div>
                </div>
              ))}
              {(!data || data.projects.length === 0) && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 italic">
                  No project data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Language Breakdown */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Code size={20} className="text-emerald-400" />
              Language Context
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
                {data?.languages.slice(0, 4).map((l) => (
                  <div key={l.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-sm text-gray-300 truncate">{l.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{l.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent API Logs */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Layout size={20} className="text-orange-400" />
              Recent API Events
            </h3>
            <div className="space-y-4">
              {data?.recentActivity.slice(0, 5).map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="p-2 rounded-lg bg-white/5">
                    <img src={log.icon} alt={log.language} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{log.file.split('/').pop()}</p>
                    <p className="text-xs text-gray-500 truncate">{log.project} • {log.language}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {(!data || data.recentActivity.length === 0) && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 italic">
                  No recent events
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="pt-8 pb-4 text-center text-gray-600 text-sm border-t border-white/5">
          DevMeter API Analytics &copy; {new Date().getFullYear()} • premium developer insights
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
