import Papa from 'papaparse';
import { SmmLogEntry, DailyTrend, AnalysisSummary, NamedValue, HourlyStats, KeywordFrequency } from '../types';

const HEADER_MAPPING: { [key: string]: keyof SmmLogEntry } = {
  '问题ID': 'questionId',
  '问题内容': 'content',
  '提问时间': 'time',
  '来源': 'source',
  '用户ID': 'userId',
  '公司名': 'company',
  '用户姓名': 'userName',
  '用户昵称': 'nickname',
  '邮箱': 'email',
  '反馈状态': 'feedbackStatus',
  '反馈内容': 'feedbackContent'
};

export const parseCSV = (file: File): Promise<SmmLogEntry[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: SmmLogEntry[] = results.data.map((row: any) => {
          const newRow: any = {};
          Object.keys(HEADER_MAPPING).forEach((zhKey) => {
            const val = row[zhKey];
            newRow[HEADER_MAPPING[zhKey]] = val ? val.trim() : '';
          });
          return newRow as SmmLogEntry;
        }).filter(item => item.content && item.time);
        
        resolve(data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Helper: Check if a user is internal
const isInternalUser = (entry: SmmLogEntry): boolean => {
  const keywords = ['smm', '上海有色网'];
  const textToCheck = [
    entry.company, 
    entry.userName, 
    entry.nickname, 
    entry.email
  ].join(' ').toLowerCase();

  return keywords.some(k => textToCheck.includes(k));
};

// --- Time Analysis ---

export const getDailyTrend = (data: SmmLogEntry[]): DailyTrend[] => {
  const stats: { [date: string]: { queries: number, users: Set<string> } } = {};
  
  data.forEach(entry => {
    const datePart = entry.time.split(' ')[0]; 
    if (datePart) {
      if (!stats[datePart]) {
        stats[datePart] = { queries: 0, users: new Set() };
      }
      stats[datePart].queries += 1;
      // Ensure we count valid user IDs
      if (entry.userId) {
        stats[datePart].users.add(entry.userId);
      }
    }
  });

  return Object.keys(stats)
    .sort()
    .map(date => ({ 
      date, 
      queries: stats[date].queries,
      dau: stats[date].users.size
    }));
};

export const getHourlyStats = (data: SmmLogEntry[]): HourlyStats[] => {
  const counts = Array(24).fill(0);
  data.forEach(entry => {
    // "YYYY-MM-DD HH:mm:ss"
    const timePart = entry.time.split(' ')[1];
    if (timePart) {
      const hour = parseInt(timePart.split(':')[0], 10);
      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        counts[hour]++;
      }
    }
  });
  return counts.map((count, hour) => ({
    hour: `${hour}:00`,
    count
  }));
};

// --- Content Analysis ---

export const classifyIntents = (data: SmmLogEntry[]): NamedValue[] => {
  const intents = {
    '闲聊/问候': /你好|早上好|晚上好|谢谢|感谢|再见|hello|hi|哈哈|牛|厉害|智障|笨蛋|测试|谁|帮助/i,
    '行情/价格': /价格|多少钱|报价|升贴水|价|结算|多少|钱|花费|行情/i,
    '趋势/预测': /走势|涨|跌|预测|后市|看法|分析|展望|趋势|动向/i,
    '数据/库存': /库存|仓单|产量|产能|进出口|表|数据|图|排产|开工率|销量|平衡表/i,
    '知识/百科': /是什么|定义|标准|工艺|介绍|牌号|区别|含义|科普/i,
    '其他': /.*/
  };

  const counts: { [key: string]: number } = {
    '闲聊/问候': 0, '行情/价格': 0, '趋势/预测': 0, '数据/库存': 0, '知识/百科': 0, '其他': 0
  };

  data.forEach(entry => {
    let matched = false;
    for (const [key, regex] of Object.entries(intents)) {
      if (key !== '其他' && regex.test(entry.content)) {
        counts[key]++;
        matched = true;
        break; // Prioritize first match for simplicity
      }
    }
    if (!matched) counts['其他']++;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

export const getMetalDistribution = (data: SmmLogEntry[]): NamedValue[] => {
  // Expanded list of metals and key commodities based on SMM business
  const metals = [
    '铜', '铝', '锌', '铅', '镍', '锡', 
    '锂', '钴', '不锈钢', '金', '银', 
    '稀土', '钨', '钼', '硅', '镁', '锰', 
    '钛', '铬', '铟', '镓', '锗', '铼', 
    '钒', '锆', '铪', '钽', '铌', '铂', 
    '钯', '铑', '铱', '钌', '锇', 
    '碳酸锂', '氢氧化锂', '磷酸铁锂', '六氟磷酸锂', '电解液', 
    '三元', '光伏', '多晶硅', '硅片', '电池', '组件', 'EVA', 'POE',
    '废钢', '废铜', '废铝', '石油焦', '阳极', '黑粉', '碳酸酯', '氧化铝'
  ];
  
  const counts: { [key: string]: number } = {};
  metals.forEach(m => counts[m] = 0);

  data.forEach(entry => {
    // Simple inclusion check. Could be optimized with regex for word boundaries if needed in Chinese context
    metals.forEach(m => {
      if (entry.content.includes(m)) counts[m]++;
    });
  });

  return Object.entries(counts)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
};

export const getTopKeywords = (data: SmmLogEntry[]): KeywordFrequency[] => {
  // Exclude common stop words and metals (since we have a metal chart)
  // Also excluding common query words to focus on business intent
  const keywords = [
    '价格', '库存', '走势', '涨', '跌', '预测', 
    '结算', '加工费', '升贴水', '现货', '期货', 
    '产量', '消费', '废', '再生', '月度', '年度',
    '成本', '利润', '供需', '产能', '开工率', 
    '报价', '均价', '指数', '进口', '出口', 
    '政策', '宏观', '美联储', '降息', '汇率',
    '行情', '分析', '数据', '报表', '日报', '周报',
    '多少钱', 'LME', 'SHFE', '长江', 'SMM', '排产', '销量'
  ];
  
  const counts: { [key: string]: number } = {};
  keywords.forEach(k => counts[k] = 0);

  data.forEach(entry => {
    keywords.forEach(k => {
      if (entry.content.includes(k)) counts[k]++;
    });
  });

  return Object.keys(counts)
    .map(keyword => ({ keyword, count: counts[keyword] }))
    .sort((a, b) => b.count - a.count)
    .filter(k => k.count > 0);
};

// --- User Analysis ---

export const getTopCompanies = (data: SmmLogEntry[]): NamedValue[] => {
  const counts: { [company: string]: number } = {};
  const INTERNAL_LABEL = '上海有色网 (SMM)';

  data.forEach(entry => {
    if (isInternalUser(entry)) {
      counts[INTERNAL_LABEL] = (counts[INTERNAL_LABEL] || 0) + 1;
    } else {
      const company = entry.company ? entry.company.trim() : '';
      if (company) {
        counts[company] = (counts[company] || 0) + 1;
      }
    }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10
    .map(([name, value]) => ({ name, value }));
};

export const getUserTypeDistribution = (data: SmmLogEntry[]): NamedValue[] => {
  let internal = 0;
  let external = 0;
  let unknown = 0;

  data.forEach(entry => {
    if (isInternalUser(entry)) {
      internal++;
    } else if (entry.company && entry.company.trim() !== '') {
      external++;
    } else {
      unknown++;
    }
  });

  return [
    { name: '内部员工', value: internal },
    { name: '外部客户', value: external },
    { name: '未知', value: unknown }
  ].filter(item => item.value > 0); // Only show segments that have data
};

export const getSourceDistribution = (data: SmmLogEntry[]): NamedValue[] => {
  const counts: { [source: string]: number } = {};
  data.forEach(entry => {
    const src = entry.source || 'Unknown';
    counts[src] = (counts[src] || 0) + 1;
  });
  return Object.keys(counts).map(name => ({ name, value: counts[name] }));
};

// --- Summary ---

const calculateRetention = (data: SmmLogEntry[]): number => {
  // Simple Next-Day Retention Estimate
  const userDays: { [date: string]: Set<string> } = {};
  data.forEach(e => {
    const date = e.time.split(' ')[0];
    if (!userDays[date]) userDays[date] = new Set();
    userDays[date].add(e.userId);
  });

  const dates = Object.keys(userDays).sort();
  if (dates.length < 2) return 0;

  let retentionSum = 0;
  let comparisons = 0;

  for (let i = 0; i < dates.length - 1; i++) {
    const today = userDays[dates[i]];
    const tomorrow = userDays[dates[i+1]];
    
    // Check intersection
    let retained = 0;
    today.forEach(uid => {
      if (tomorrow.has(uid)) retained++;
    });

    if (today.size > 0) {
      retentionSum += (retained / today.size);
      comparisons++;
    }
  }

  return comparisons > 0 ? (retentionSum / comparisons) * 100 : 0;
};

export const getSummaryStats = (data: SmmLogEntry[]): AnalysisSummary => {
  const totalQueries = data.length;
  const uniqueUsers = new Set(data.map(d => d.userId)).size;
  const avgQueriesPerUser = uniqueUsers > 0 ? totalQueries / uniqueUsers : 0;
  
  const sources = getSourceDistribution(data);
  const topSource = sources.sort((a, b) => b.value - a.value)[0]?.name || 'N/A';

  const trends = getDailyTrend(data);
  const busiestDay = trends.sort((a, b) => b.queries - a.queries)[0]?.date || 'N/A';

  const retentionRate = calculateRetention(data);

  return {
    totalQueries,
    uniqueUsers,
    avgQueriesPerUser,
    retentionRate,
    topSource,
    busiestDay
  };
};