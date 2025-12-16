import React, { useState } from 'react';
import { 
  parseCSV, 
  getDailyTrend, 
  getSourceDistribution, 
  getTopKeywords, 
  getSummaryStats,
  getHourlyStats,
  classifyIntents,
  getMetalDistribution,
  getTopCompanies,
  getUserTypeDistribution
} from './services/dataProcessing';
import { analyzeUserIntent } from './services/geminiService';
import { AnalysisCharts } from './components/AnalysisCharts';
import { 
  SmmLogEntry, 
  DailyTrend, 
  NamedValue, 
  KeywordFrequency, 
  AnalysisSummary,
  HourlyStats
} from './types';
import { Upload, BarChart3, Users, MessageSquare, Zap, Target, History } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<SmmLogEntry[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  
  // Chart Data States
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [sourceData, setSourceData] = useState<NamedValue[]>([]);
  const [intentData, setIntentData] = useState<NamedValue[]>([]);
  const [metalData, setMetalData] = useState<NamedValue[]>([]);
  const [companyData, setCompanyData] = useState<NamedValue[]>([]);
  const [userTypeData, setUserTypeData] = useState<NamedValue[]>([]);
  const [keywordData, setKeywordData] = useState<KeywordFrequency[]>([]);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseCSV(file);
      setData(parsedData);
      
      // Process All Analytics
      setSummary(getSummaryStats(parsedData));
      setDailyTrend(getDailyTrend(parsedData));
      setHourlyStats(getHourlyStats(parsedData));
      setSourceData(getSourceDistribution(parsedData));
      setIntentData(classifyIntents(parsedData));
      setMetalData(getMetalDistribution(parsedData));
      setCompanyData(getTopCompanies(parsedData));
      setUserTypeData(getUserTypeDistribution(parsedData));
      setKeywordData(getTopKeywords(parsedData));
      
      // Auto trigger AI Analysis
      triggerAiAnalysis(parsedData);
    } catch (error) {
      console.error("Error parsing file", error);
      alert("解析 CSV 文件失败");
    }
  };

  const triggerAiAnalysis = async (dataset: SmmLogEntry[]) => {
    if (dataset.length === 0) return;
    setLoadingAi(true);
    setAiAnalysis(''); // Clear previous
    try {
      const result = await analyzeUserIntent(dataset);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("<p>分析失败，请重试。</p>");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SMM AI 智能助手分析</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-slate-200">
                <Upload className="w-4 h-4" />
                上传数据
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
             </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!summary ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
            <div className="bg-blue-50 p-6 rounded-full mb-6">
              <Upload className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">开始分析</h3>
            <p className="text-slate-500 mt-2 text-center max-w-md">请上传 SMM AI 助手的日志 CSV 文件以生成行为分析报告。</p>
            <label className="mt-8 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-base font-medium transition-colors shadow-blue-200 shadow-lg">
                选择 CSV 文件
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
             </label>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* 1. Overview Cards */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">核心指标 (Core Metrics)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard 
                  label="总提问量 (Queries)" 
                  value={summary.totalQueries.toLocaleString()} 
                  icon={<MessageSquare className="w-5 h-5 text-blue-600" />} 
                  bg="bg-blue-50" 
                />
                <KpiCard 
                  label="独立用户数 (UV)" 
                  value={summary.uniqueUsers.toLocaleString()} 
                  icon={<Users className="w-5 h-5 text-indigo-600" />} 
                  bg="bg-indigo-50" 
                />
                <KpiCard 
                  label="人均提问数" 
                  value={summary.avgQueriesPerUser.toFixed(1)} 
                  icon={<Target className="w-5 h-5 text-emerald-600" />} 
                  bg="bg-emerald-50" 
                  subtext="用户粘性指标"
                />
                <KpiCard 
                  label="次日留存率" 
                  value={`${summary.retentionRate.toFixed(1)}%`} 
                  icon={<History className="w-5 h-5 text-amber-600" />} 
                  bg="bg-amber-50" 
                  subtext="预估活跃度"
                />
              </div>
            </section>

            {/* 2. Visual Analytics */}
            <section>
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">深度行为分析 (Deep Dive)</h2>
               <AnalysisCharts 
                 dailyTrend={dailyTrend}
                 hourlyStats={hourlyStats}
                 sourceData={sourceData}
                 intentData={intentData}
                 metalData={metalData}
                 companyData={companyData}
                 userTypeData={userTypeData}
                 keywordData={keywordData} 
               />
            </section>

            {/* 3. AI Insights */}
            <section className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-1 border border-purple-100 shadow-sm">
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600 fill-purple-100" />
                      Gemini 智能洞察
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">基于 AI 的用户意图、情感及长尾问题深度定性分析。</p>
                  </div>
                  {/* Button removed as requested, generation is automatic */}
                </div>
                
                <div className="p-8 bg-white min-h-[200px]">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-slate-500 font-medium animate-pulse">Gemini 正在深入阅读日志...</p>
                    </div>
                  ) : aiAnalysis ? (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: aiAnalysis }} 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                       <p className="text-slate-400">数据分析中...</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

const KpiCard = ({ label, value, icon, bg, subtext }: { label: string, value: string, icon: React.ReactNode, bg: string, subtext?: string }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`${bg} p-2.5 rounded-lg`}>
      {icon}
    </div>
  </div>
);

export default App;