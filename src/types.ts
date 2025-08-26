export interface ClaudeGroup {
  id: string;
  endpoint: string;
  apiKey: string;
}

export interface ScheduleConfig {
  mode: 'hourly' | 'custom';
  customStartHour?: number;
  customEndHour?: number;
  customWeekdays?: number[];
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