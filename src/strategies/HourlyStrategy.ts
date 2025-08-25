import { IScheduleStrategy } from './IScheduleStrategy';
import { ClaudeAgent } from '../agent';
import { ScheduleTask } from '../types';

export class HourlyStrategy implements IScheduleStrategy {
  private agents: Map<string, ClaudeAgent> = new Map();
  private scheduledTasks: ScheduleTask[] = [];
  private lastScheduledHour: number = -1;
  
  initialize(agents: Map<string, ClaudeAgent>): void {
    this.agents = agents;
    this.scheduleNextHourTasks();
  }
  
  getNextTasks(): ScheduleTask[] {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 每个小时调度一次下一小时的任务
    if (currentHour !== this.lastScheduledHour) {
      this.scheduleNextHourTasks();
      this.lastScheduledHour = currentHour;
    }
    
    // 清理过期任务
    const cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
    this.scheduledTasks = this.scheduledTasks.filter(task => task.scheduledTime > cutoffTime);
    
    return [...this.scheduledTasks];
  }
  
  shouldRunNow(time: Date): boolean {
    // 在 hourly 模式下，总是可以运行
    return true;
  }
  
  getName(): string {
    return 'HOURLY';
  }
  
  private scheduleNextHourTasks(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 1) % 24;
    
    console.log(`[${this.getName()}] Scheduling tasks for hour ${nextHour}:00`);
    
    // 为每个代理安排下一个小时的任务
    this.agents.forEach((agent, groupId) => {
      // 随机时间：整点后1-5分钟
      const randomMinutes = Math.floor(Math.random() * 5) + 1;
      const scheduledTime = new Date();
      scheduledTime.setHours(nextHour, randomMinutes, 0, 0);
      
      // 如果是当前小时且时间已过，则安排到明天同一时间
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const task: ScheduleTask = {
        id: `${groupId}_${scheduledTime.getTime()}`,
        groupId,
        scheduledTime
      };
      
      this.scheduledTasks.push(task);
      console.log(`[${this.getName()}] Scheduled task for ${groupId} at ${scheduledTime.toLocaleString()}`);
    });
  }
}