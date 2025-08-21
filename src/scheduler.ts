import * as cron from 'node-cron';
import { ClaudeAgent } from './agent';
import { ClaudeGroup, ScheduleTask } from './types';

export class TaskScheduler {
  private agents: Map<string, ClaudeAgent> = new Map();
  private scheduledTasks: ScheduleTask[] = [];
  
  constructor(groups: ClaudeGroup[]) {
    // 为每个组创建独立的代理实例
    groups.forEach(group => {
      this.agents.set(group.id, new ClaudeAgent(group));
    });
  }
  
  start(): void {
    console.log('Starting task scheduler...');
    
    // 首次启动立即发送保活消息
    this.sendInitialKeepAliveMessages();
    
    // 每分钟检查是否需要执行任务
    cron.schedule('* * * * *', () => {
      this.checkAndExecuteTasks();
    });
    
    // 每个整点后安排下一批任务
    cron.schedule('0 * * * *', () => {
      this.scheduleNextHourTasks();
    });
    
    // 初始化：为当前小时安排任务
    this.scheduleNextHourTasks();
  }
  
  private scheduleNextHourTasks(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 1) % 24;
    
    console.log(`Scheduling tasks for hour ${nextHour}:00`);
    
    // 清除旧任务
    this.scheduledTasks = [];
    
    // 为每个代理安排一个随机时间的任务（整点后1-5分钟）
    this.agents.forEach((agent, groupId) => {
      const randomMinutes = Math.floor(Math.random() * 5) + 1; // 1-5分钟
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
      console.log(`Scheduled task for ${groupId} at ${scheduledTime.toLocaleString()}`);
    });
  }
  
  private async checkAndExecuteTasks(): Promise<void> {
    const now = new Date();
    const tasksToExecute = this.scheduledTasks.filter(task => 
      task.scheduledTime <= now
    );
    
    if (tasksToExecute.length === 0) {
      return;
    }
    
    console.log(`Executing ${tasksToExecute.length} scheduled tasks...`);
    
    // 并行执行所有到期的任务
    const promises = tasksToExecute.map(async (task) => {
      const agent = this.agents.get(task.groupId);
      if (agent) {
        try {
          await agent.sendKeepAliveMessage();
        } catch (error) {
          console.error(`Failed to execute task ${task.id}:`, error);
        }
      }
    });
    
    await Promise.all(promises);
    
    // 移除已执行的任务
    this.scheduledTasks = this.scheduledTasks.filter(task => 
      !tasksToExecute.includes(task)
    );
  }
  
  private async sendInitialKeepAliveMessages(): Promise<void> {
    console.log('Sending initial keep-alive messages for all groups...');
    
    const promises = Array.from(this.agents.entries()).map(async ([groupId, agent]) => {
      try {
        console.log(`[INITIAL] Sending keep-alive message for ${groupId}...`);
        await agent.sendKeepAliveMessage();
      } catch (error) {
        console.error(`[INITIAL] Failed to send keep-alive message for ${groupId}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log('Initial keep-alive messages completed.');
  }
  
  getScheduledTasks(): ScheduleTask[] {
    return [...this.scheduledTasks];
  }
}