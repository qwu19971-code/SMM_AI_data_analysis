import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  ComposedChart
} from 'recharts';
import { DailyTrend, NamedValue, HourlyStats, KeywordFrequency } from '../types';

interface AnalysisChartsProps {
  dailyTrend: DailyTrend[];
  hourlyStats: HourlyStats[];
  sourceData: NamedValue[];
  intentData: NamedValue[];
  metalData: NamedValue[];
  companyData: NamedValue[];
  userTypeData: NamedValue[];
  keywordData: KeywordFrequency[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50 pointer-events-none">
        {/* Render label if available (Cartesian charts) */}
        {label && <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>}
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
              // Robustly determine name:
              // 1. entry.name (standard Recharts behavior if nameKey is set)
              // 2. entry.payload.name (fallback to original data object)
              const name = entry.name || entry.payload?.name || 'Unknown';
              const value = entry.value;
              
              // Robustly determine color:
              // 1. entry.color (Line/Bar)
              // 2. entry.fill (Pie Cell fill)
              // 3. entry.payload.fill (Original data fill if present)
              const color = entry.color || entry.fill || entry.payload?.fill || '#333';
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-slate-500">{name}:</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ 
  dailyTrend, 
  hourlyStats, 
  sourceData, 
  intentData,
  metalData,
  companyData,
  userTypeData,
  keywordData
}) => {
  return (
    <div className="space-y-8">
      
      {/* SECTION 1: Time & Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">每日流量趋势 (PV & UV)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" tick={{fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{ opacity: 0.1 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="queries" name="总提问量 (PV)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="dau" 
                  name="日活用户 (DAU)" 
                  stroke="#eab308" 
                  strokeWidth={3} 
                  dot={{r:4, fill: "#eab308"}} 
                  activeDot={{r: 6}}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">用户活跃时段分布</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{fontSize: 10}} stroke="#64748b" />
                <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', opacity: 0.5}} />
                <Bar dataKey="count" name="提问次数" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: Content Analysis (Rearranged) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">用户意图分类</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={intentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {intentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">热门金属品种</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metalData} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={40} tick={{fontSize: 12}} stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="提及次数" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       {/* SECTION 3: Keywords */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">高频词云 (Top Keywords)</h3>
          <div className="flex flex-wrap gap-2">
            {keywordData.slice(0, 25).map((k, i) => (
               <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors">
                 {k.keyword} <span className="text-slate-400 ml-1">{k.count}</span>
               </span>
            ))}
          </div>
      </div>

      {/* SECTION 4: Customer & Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">活跃公司 Top 10</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} layout="vertical" margin={{left: 60}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} stroke="#64748b" interval={0} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="提问次数" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-6">
           {/* Increased height container to 60% approx to ensure pie chart tooltip has room */}
           <div className="flex-1 min-h-[160px]">
             <h3 className="text-lg font-semibold text-slate-800 mb-2">用户类型分布</h3>
             <div className="h-full min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#94a3b8" />
                      <Cell fill="#cbd5e1" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
           </div>
           
           <div className="h-[140px] border-t border-slate-100 pt-4">
             <h3 className="text-lg font-semibold text-slate-800 mb-2">平台来源分布</h3>
             <div className="h-[100px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={sourceData}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} stroke="#64748b" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="来源数" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
};
