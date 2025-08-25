import * as cron from 'node-cron';
import { ClaudeAgent } from './agent';
import { ClaudeGroup, ScheduleTask, ScheduleConfig } from './types';
import { IScheduleStrategy, StrategyFactory } from './strategies';

export class TaskScheduler {
  private agents: Map<string, ClaudeAgent> = new Map();
  private strategy: IScheduleStrategy;
  private scheduledTasks: ScheduleTask[] = [];
  
  constructor(groups: ClaudeGroup[], scheduleConfig: ScheduleConfig) {
    // 为每个组创建独立的代理实例
    groups.forEach(group => {
      this.agents.set(group.id, new ClaudeAgent(group));
    });
    
    // 创建调度策略
    this.strategy = StrategyFactory.createStrategy(scheduleConfig);
    console.log(`[SCHEDULER] Using ${this.strategy.getName()} strategy`);
  }
  
  start(): void {
    console.log('[SCHEDULER] Starting task scheduler...');
    
    // 初始化策略
    this.strategy.initialize(this.agents);
    
    // 首次启动立即发送保活消息
    this.sendInitialKeepAliveMessages().catch(error => {
      console.error('[SCHEDULER] Failed to send initial keep-alive messages:', error);
    });
    
    // 每分钟检查是否需要执行任务
    cron.schedule('* * * * *', () => {
      this.checkAndExecuteTasks().catch(error => {
        console.error('[SCHEDULER] Error in checkAndExecuteTasks:', error);
      });
    });
    
    // 每分钟更新任务列表
    cron.schedule('* * * * *', () => {
      try {
        this.updateScheduledTasks();
      } catch (error) {
        console.error('[SCHEDULER] Error in updateScheduledTasks:', error);
      }
    });
    
    // 初始化任务列表
    this.updateScheduledTasks();
    console.log('[SCHEDULER] Task scheduler started successfully');
  }
  
  private updateScheduledTasks(): void {
    // 从策略获取最新的任务列表
    this.scheduledTasks = this.strategy.getNextTasks();
    
    if (this.scheduledTasks.length > 0) {
      console.log(`[SCHEDULER] Updated task list: ${this.scheduledTasks.length} tasks scheduled`);
    }
  }
  
  private async checkAndExecuteTasks(): Promise<void> {
    const now = new Date();
    
    // 检查策略是否允许当前时间执行
    if (!this.strategy.shouldRunNow(now)) {
      return;
    }
    
    const tasksToExecute = this.scheduledTasks.filter(task =>
      task.scheduledTime <= now
    );
    
    if (tasksToExecute.length === 0) {
      return;
    }
    
    console.log(`[SCHEDULER] Executing ${tasksToExecute.length} scheduled tasks at ${now.toLocaleString()}`);
    
    // 并行执行所有到期的任务
    const promises = tasksToExecute.map(async (task) => {
      const agent = this.agents.get(task.groupId);
      if (agent) {
        try {
          console.log(`[SCHEDULER] Executing task ${task.id} for ${task.groupId}`);
          const success = await agent.sendKeepAliveMessage();
          if (!success) {
            console.warn(`[SCHEDULER] Task ${task.id} returned false, but will be marked as completed`);
          }
        } catch (error) {
          console.error(`[SCHEDULER] Failed to execute task ${task.id}:`, error);
        }
      } else {
        console.error(`[SCHEDULER] No agent found for task ${task.id} with groupId ${task.groupId}`);
      }
    });
    
    await Promise.all(promises);
    
    // 从任务列表中移除已执行的任务
    this.scheduledTasks = this.scheduledTasks.filter(task =>
      !tasksToExecute.includes(task)
    );
    
    console.log(`[SCHEDULER] Completed ${tasksToExecute.length} tasks. Remaining tasks: ${this.scheduledTasks.length}`);
  }
  
  private async sendInitialKeepAliveMessages(): Promise<void> {
    console.log('[SCHEDULER] Sending initial keep-alive messages for all groups...');
    
    const promises = Array.from(this.agents.entries()).map(async ([groupId, agent]) => {
      try {
        console.log(`[INITIAL] Sending keep-alive message for ${groupId}...`);
        await agent.sendKeepAliveMessage();
      } catch (error) {
        console.error(`[INITIAL] Failed to send keep-alive message for ${groupId}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log('[SCHEDULER] Initial keep-alive messages completed.');
  }
  
  getScheduledTasks(): ScheduleTask[] {
    return [...this.scheduledTasks];
  }
}