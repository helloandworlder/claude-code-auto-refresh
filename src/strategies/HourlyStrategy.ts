import { ScheduleStrategy } from './ScheduleStrategy';
import { ClaudeAgent } from '../agent';
import { ScheduleTask } from '../types';

export class HourlyStrategy implements ScheduleStrategy {
  scheduleNextHourTasks(agents: Map<string, ClaudeAgent>, currentTasks: ScheduleTask[]): ScheduleTask[] {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 1) % 24;
    
    console.log(`Scheduling tasks for hour ${nextHour}:00`);
    
    const newTasks: ScheduleTask[] = [];
    
    agents.forEach((agent, groupId) => {
      const randomMinutes = Math.floor(Math.random() * 5) + 1; // 1-5分钟
      const scheduledTime = new Date();
      scheduledTime.setHours(nextHour, randomMinutes, 0, 0);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const task: ScheduleTask = {
        id: `${groupId}_${scheduledTime.getTime()}_${Math.random().toString(36).substring(2, 8)}`,
        groupId,
        scheduledTime
      };
      
      newTasks.push(task);
      console.log(`Scheduled task for ${groupId} at ${scheduledTime.toLocaleString()}`);
    });
    
    return newTasks;
  }
  
  shouldExecuteTask(task: ScheduleTask): boolean {
    return true;
  }
}