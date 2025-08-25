import { IScheduleStrategy } from './IScheduleStrategy';
import { HourlyStrategy } from './HourlyStrategy';
import { CustomStrategy } from './CustomStrategy';
import { ScheduleConfig, ScheduleMode } from '../types';

export class StrategyFactory {
  static createStrategy(config: ScheduleConfig): IScheduleStrategy {
    switch (config.mode) {
      case ScheduleMode.HOURLY:
        return new HourlyStrategy();
      
      case ScheduleMode.CUSTOM:
        if (!config.customSchedule) {
          throw new Error('Custom schedule configuration is required for CUSTOM mode');
        }
        return new CustomStrategy(config.customSchedule);
      
      default:
        throw new Error(`Unknown schedule mode: ${config.mode}`);
    }
  }
}