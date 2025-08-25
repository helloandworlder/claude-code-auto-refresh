export interface ClaudeGroup {
  id: string;
  endpoint: string;
  apiKey: string;
}

export enum ScheduleMode {
  HOURLY = 'hourly',    // 默认每小时触发
  CUSTOM = 'custom'      // 自定义时间区间
}

export interface CustomScheduleConfig {
  startTime: string;     // HH:mm 格式，如 "09:00"
  endTime: string;       // HH:mm 格式，如 "02:00" (支持跨天)
  interval: number;      // 间隔分钟数，如 30
  weekdays?: number[];   // 可选：指定工作日 [1-7]，1=周一，7=周日
}

export interface ScheduleConfig {
  mode: ScheduleMode;
  customSchedule?: CustomScheduleConfig;
}

export interface AgentConfig {
  groups: ClaudeGroup[];
  logLevel: string;
  schedule: ScheduleConfig;
}

export interface ScheduleTask {
  id: string;
  groupId: string;
  scheduledTime: Date;
}