export interface ClaudeGroup {
  id: string;
  endpoint: string;
  apiKey: string;
}

export interface AgentConfig {
  groups: ClaudeGroup[];
  logLevel: string;
}

export interface ScheduleTask {
  id: string;
  groupId: string;
  scheduledTime: Date;
}