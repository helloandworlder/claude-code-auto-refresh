import * as cron from 'node-cron';
import { ClaudeAgent } from './agent';
import { ClaudeGroup, ScheduleTask, ScheduleConfig } from './types';
import { ScheduleStrategy } from './strategies/ScheduleStrategy';
import { HourlyStrategy } from './strategies/HourlyStrategy';
import { CustomStrategy } from './strategies/CustomStrategy';

export class TaskScheduler {
  private agents: Map<string, ClaudeAgent> = new Map();
  private scheduledTasks: ScheduleTask[] = [];
  private strategy: ScheduleStrategy;
  
  constructor(groups: ClaudeGroup[], scheduleConfig: ScheduleConfig) {
    // 为每个组创建独立的代理实例
    groups.forEach(group => {
      this.agents.set(group.id, new ClaudeAgent(group));
    });
    
    // 根据配置创建相应的调度策略
    this.strategy = this.createStrategy(scheduleConfig);
  }
  
  private createStrategy(config: ScheduleConfig): ScheduleStrategy {
    if (config.mode === 'custom') {
      return new CustomStrategy(
        config.customStartHour!,
        config.customEndHour!,
        config.customWeekdays!
      );
    }
    
    return new HourlyStrategy();
  }
  
  start(): void {
    console.log('[SCHEDULER] Starting task scheduler...');
    
    // 首次启动立即发送保活消息
    this.sendInitialKeepAliveMessages().catch(error => {
      console.error('[SCHEDULER] Failed to send initial keep-alive messages:', error);
    });
    
    // 每分钟检查是否需要执行任务
    cron.schedule('* * * * *', () => {
      this.checkAndExecuteTasks().catch(error => {
        console.error('[SCHEDULER] Error in checkAndExecuteTasks:', error);
      });
    }, { timezone: process.env.TZ || 'Asia/Shanghai' });
    
    // 每个整点后安排下一批任务
    cron.schedule('0 * * * *', () => {
      try {
        console.log('[SCHEDULER] Hourly scheduling trigger at', new Date().toLocaleString());
        this.scheduleNextHourTasks();
      } catch (error) {
        console.error('[SCHEDULER] Error in scheduleNextHourTasks:', error);
      }
    }, { timezone: process.env.TZ || 'Asia/Shanghai' });
    
    // 初始化：为当前小时和下一小时安排任务
    try {
      this.scheduleNextHourTasks();
      console.log('[SCHEDULER] Initial task scheduling completed');
    } catch (error) {
      console.error('[SCHEDULER] Failed to schedule initial tasks:', error);
    }
  }
  
  private scheduleNextHourTasks(): void {
    const now = new Date();
    
    // 只清除过期的任务，保留未来的任务
    const cutoffTime = new Date(now.getTime() - 5 * 60 * 1000); // 5分钟前
    this.scheduledTasks = this.scheduledTasks.filter(task => task.scheduledTime > cutoffTime);
    
    // 使用策略生成新任务
    const newTasks = this.strategy.scheduleNextHourTasks(this.agents, this.scheduledTasks);
    this.scheduledTasks.push(...newTasks);
  }
  
  private async checkAndExecuteTasks(): Promise<void> {
    const now = new Date();
    const tasksToExecute = this.scheduledTasks.filter(task =>
      task.scheduledTime <= now && this.strategy.shouldExecuteTask(task)
    );
    
    if (tasksToExecute.length === 0) {
      return;
    }
    
    console.log(`[SCHEDULER] Executing ${tasksToExecute.length} scheduled tasks at ${now.toLocaleString()}`);
    
    try {
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
            // 即使失败也移除任务，避免重复执行失败的任务
          }
        } else {
          console.error(`[SCHEDULER] No agent found for task ${task.id} with groupId ${task.groupId}`);
        }
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error(`[SCHEDULER] Critical error during task execution:`, error);
    } finally {
      // 无论执行成功还是失败，都移除已处理的任务，防止死循环
      this.scheduledTasks = this.scheduledTasks.filter(task =>
        !tasksToExecute.includes(task)
      );
      
      console.log(`[SCHEDULER] Completed ${tasksToExecute.length} tasks. Remaining tasks: ${this.scheduledTasks.length}`);
    }
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
