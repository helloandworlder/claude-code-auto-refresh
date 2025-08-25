import { IScheduleStrategy } from './IScheduleStrategy';
import { ClaudeAgent } from '../agent';
import { ScheduleTask, CustomScheduleConfig } from '../types';

export class CustomStrategy implements IScheduleStrategy {
  private agents: Map<string, ClaudeAgent> = new Map();
  private scheduledTasks: ScheduleTask[] = [];
  private config: CustomScheduleConfig;
  private lastScheduledTime: Date | null = null;
  
  constructor(config: CustomScheduleConfig) {
    this.config = config;
  }
  
  initialize(agents: Map<string, ClaudeAgent>): void {
    this.agents = agents;
    this.scheduleNextTasks();
  }
  
  getNextTasks(): ScheduleTask[] {
    const now = new Date();
    
    // 清理过期任务
    const cutoffTime = new Date(now.getTime() - 5 * 60 * 1000);
    this.scheduledTasks = this.scheduledTasks.filter(task => task.scheduledTime > cutoffTime);
    
    // 检查是否需要调度新任务
    if (this.shouldScheduleNewTasks(now)) {
      this.scheduleNextTasks();
    }
    
    return [...this.scheduledTasks];
  }
  
  shouldRunNow(time: Date): boolean {
    // 检查是否在工作日限制内
    if (this.config.weekdays && this.config.weekdays.length > 0) {
      const dayOfWeek = time.getDay() || 7; // 0=周日转换为7
      if (!this.config.weekdays.includes(dayOfWeek)) {
        return false;
      }
    }
    
    // 检查是否在时间区间内
    return this.isInTimeRange(time);
  }
  
  getName(): string {
    return 'CUSTOM';
  }
  
  private isInTimeRange(time: Date): boolean {
    const [startHour, startMin] = this.config.startTime.split(':').map(Number);
    const [endHour, endMin] = this.config.endTime.split(':').map(Number);
    
    const currentMinutes = time.getHours() * 60 + time.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes < startMinutes) {
      // 跨天情况：如 21:00 - 02:00
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      // 同一天：如 09:00 - 18:00
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  }
  
  private shouldScheduleNewTasks(now: Date): boolean {
    // 如果还没有调度过任务
    if (!this.lastScheduledTime) {
      return true;
    }
    
    // 如果距离上次调度已经过了interval分钟
    const timeSinceLastSchedule = now.getTime() - this.lastScheduledTime.getTime();
    return timeSinceLastSchedule >= (this.config.interval - 1) * 60 * 1000;
  }
  
  private scheduleNextTasks(): void {
    const now = new Date();
    
    // 计算下一个执行时间
    let nextTime = this.calculateNextExecutionTime(now);
    
    if (!nextTime) {
      console.log(`[${this.getName()}] No valid execution time found within time range`);
      return;
    }
    
    console.log(`[${this.getName()}] Scheduling tasks for ${nextTime.toLocaleString()}`);
    
    // 为每个代理创建任务
    this.agents.forEach((agent, groupId) => {
      // 添加0-60秒的随机延迟，避免所有任务同时执行
      const randomSeconds = Math.floor(Math.random() * 60);
      const scheduledTime = new Date(nextTime.getTime() + randomSeconds * 1000);
      
      const task: ScheduleTask = {
        id: `${groupId}_${scheduledTime.getTime()}`,
        groupId,
        scheduledTime
      };
      
      this.scheduledTasks.push(task);
      console.log(`[${this.getName()}] Scheduled task for ${groupId} at ${scheduledTime.toLocaleString()}`);
    });
    
    this.lastScheduledTime = now;
  }
  
  private calculateNextExecutionTime(from: Date): Date | null {
    let nextTime = new Date(from);
    nextTime.setSeconds(0, 0);
    
    // 如果当前在时间区间内
    if (this.isInTimeRange(from)) {
      // 计算下一个间隔点
      const minutes = Math.ceil(from.getMinutes() / this.config.interval) * this.config.interval;
      nextTime.setMinutes(minutes);
      
      // 如果计算出的时间已过，添加一个间隔
      if (nextTime <= from) {
        nextTime.setMinutes(nextTime.getMinutes() + this.config.interval);
      }
      
      // 检查是否仍在区间内
      if (this.isInTimeRange(nextTime) && this.isValidWeekday(nextTime)) {
        return nextTime;
      }
    }
    
    // 计算下一个开始时间
    return this.getNextStartTime(from);
  }
  
  private getNextStartTime(from: Date): Date | null {
    const [startHour, startMin] = this.config.startTime.split(':').map(Number);
    let nextStart = new Date(from);
    nextStart.setHours(startHour, startMin, 0, 0);
    
    // 如果今天的开始时间已过
    if (nextStart <= from) {
      // 如果是跨天的情况且当前仍在昨天的区间内
      if (this.isInTimeRange(from)) {
        // 返回下一个间隔时间
        const nextTime = new Date(from);
        nextTime.setMinutes(Math.ceil(from.getMinutes() / this.config.interval) * this.config.interval, 0, 0);
        if (nextTime > from && this.isInTimeRange(nextTime)) {
          return nextTime;
        }
      }
      
      // 否则设置为明天的开始时间
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    // 检查工作日限制，最多查找7天
    for (let i = 0; i < 7; i++) {
      if (this.isValidWeekday(nextStart)) {
        return nextStart;
      }
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    return null;
  }
  
  private isValidWeekday(time: Date): boolean {
    if (!this.config.weekdays || this.config.weekdays.length === 0) {
      return true;
    }
    
    const dayOfWeek = time.getDay() || 7; // 0=周日转换为7
    return this.config.weekdays.includes(dayOfWeek);
  }
}