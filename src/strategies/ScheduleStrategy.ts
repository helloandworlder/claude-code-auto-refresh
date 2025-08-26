import { ClaudeAgent } from '../agent';
import { ScheduleTask } from '../types';

export interface ScheduleStrategy {
  scheduleNextHourTasks(agents: Map<string, ClaudeAgent>, currentTasks: ScheduleTask[]): ScheduleTask[];
  shouldExecuteTask(task: ScheduleTask): boolean;
}