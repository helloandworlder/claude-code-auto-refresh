import { ScheduleStrategy } from './ScheduleStrategy';
import { ClaudeAgent } from '../agent';
import { ScheduleTask } from '../types';

export class CustomStrategy implements ScheduleStrategy {
  private startHour: number;
  private endHour: number;
  private weekdays: number[];
  
  constructor(startHour: number, endHour: number, weekdays: number[]) {
    this.startHour = startHour;
    this.endHour = endHour;
    this.weekdays = weekdays;
  }
  
  scheduleNextHourTasks(agents: Map<string, ClaudeAgent>, currentTasks: ScheduleTask[]): ScheduleTask[] {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 1) % 24;
    
    if (!this.isWorkingHour(nextHour)) {
      console.log(`Skipping task scheduling for hour ${nextHour}:00 (outside working hours ${this.startHour}:00-${this.endHour}:00)`);
      return [];
    }
    
    console.log(`Scheduling tasks for hour ${nextHour}:00 (custom mode)`);
    
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
      console.log(`Scheduled task for ${groupId} at ${scheduledTime.toLocaleString()} (custom mode)`);
    });
    
    return newTasks;
  }
  
  shouldExecuteTask(task: ScheduleTask): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentWeekday = now.getDay();
    
    if (!this.isWorkingHour(currentHour)) {
      console.log(`Skipping task execution (outside working hours ${this.startHour}:00-${this.endHour}:00, current: ${currentHour}:00)`);
      return false;
    }
    
    if (!this.weekdays.includes(currentWeekday)) {
      console.log(`Skipping task execution (not a working day, current: ${currentWeekday}, allowed: ${this.weekdays.join(',')})`);
      return false;
    }
    
    return true;
  }
  
  private isWorkingHour(hour: number): boolean {
    // 处理完整小时格式，如9:00-18:00
    // startHour=9, endHour=18 表示 9:00 到 18:00（不包含18:00）
    if (this.startHour <= this.endHour) {
      // 正常情况：9:00-18:00 
      return hour >= this.startHour && hour < this.endHour;
    } else {
      // 跨天情况：22:00-6:00
      return hour >= this.startHour || hour < this.endHour;
    }
  }
}