import { ClaudeAgent } from '../agent';
import { ScheduleTask } from '../types';

export interface IScheduleStrategy {
  initialize(agents: Map<string, ClaudeAgent>): void;
  getNextTasks(): ScheduleTask[];
  shouldRunNow(time: Date): boolean;
  getName(): string;
}