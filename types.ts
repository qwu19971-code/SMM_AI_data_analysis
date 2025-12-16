export interface SmmLogEntry {
  questionId: string;
  content: string;
  time: string;
  source: string;
  userId: string;
  company: string;
  userName?: string;
  nickname?: string;
  email?: string;
  feedbackStatus?: string; // '点赞' | '点踩' | ''
  feedbackContent?: string;
  [key: string]: any;
}

export interface DailyTrend {
  date: string;
  queries: number;
  dau: number;
  [key: string]: any;
}

export interface SourceDistribution {
  name: string;
  value: number;
  [key: string]: any;
}

export interface KeywordFrequency {
  keyword: string;
  count: number;
  [key: string]: any;
}

export interface AnalysisSummary {
  totalQueries: number;
  uniqueUsers: number;
  avgQueriesPerUser: number;
  retentionRate: number; // Next-day retention %
  topSource: string;
  busiestDay: string;
}

export interface NamedValue {
  name: string;
  value: number;
  [key: string]: any;
}

export interface HourlyStats {
  hour: string;
  count: number;
  [key: string]: any;
}