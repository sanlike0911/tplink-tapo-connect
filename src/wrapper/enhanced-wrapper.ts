/**
 * Enhanced Tapo Wrapper with optional retry support
 * 
 * This wrapper provides both basic (fast) and robust (retry-enabled) methods,
 * allowing users to choose between performance and reliability based on their needs.
 */

import { tplinkTapoConnectWrapper, tplinkTapoConnectWrapperType, TapoDeviceType } from './tplink_tapo_connect_wrapper';
import { TapoRetryHandler, RetryConfig, RetryResult } from '../utils/retry-utils';

export interface EnhancedWrapperOptions {
  retryConfig?: RetryConfig;
  enableRetryByDefault?: boolean;
}

export class EnhancedTapoWrapper {
  private wrapper: tplinkTapoConnectWrapper;
  private retryHandler?: TapoRetryHandler;
  private enableRetryByDefault: boolean;

  constructor(options: EnhancedWrapperOptions = {}) {
    this.wrapper = tplinkTapoConnectWrapper.getInstance();
    this.enableRetryByDefault = options.enableRetryByDefault ?? false;
    
    if (options.retryConfig) {
      this.retryHandler = new TapoRetryHandler(options.retryConfig);
    }
  }

  /**
   * Get device info - basic version (fast, no retry)
   */
  public async getDeviceInfo(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'auto'
  ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
    return this.wrapper.getTapoDeviceInfo(email, password, ip, deviceType);
  }

  /**
   * Get device info - robust version (with retry)
   */
  public async getDeviceInfoRobust(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'auto'
  ): Promise<RetryResult<tplinkTapoConnectWrapperType.tapoConnectResults>> {
    const handler = this.retryHandler || TapoRetryHandler.forInfoRetrieval();
    
    return handler.execute(
      () => this.wrapper.getTapoDeviceInfo(email, password, ip, deviceType),
      'getDeviceInfo'
    );
  }

  /**
   * Turn on device - basic version (fast, no retry)
   */
  public async turnOn(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'auto'
  ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
    return this.wrapper.setTapoTurnOn(email, password, ip, deviceType);
  }

  /**
   * Turn on device - robust version (with retry)
   */
  public async turnOnRobust(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'auto'
  ): Promise<RetryResult<tplinkTapoConnectWrapperType.tapoConnectResults>> {
    const handler = this.retryHandler || TapoRetryHandler.forDeviceControl();
    
    return handler.execute(
      () => this.wrapper.setTapoTurnOn(email, password, ip, deviceType),
      'turnOn'
    );
  }

  /**
   * Turn off device - basic version (fast, no retry)
   */
  public async turnOff(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'auto'
  ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
    return this.wrapper.setTapoTurnOff(email, password, ip, deviceType);
  }

  /**
   * Turn off device - robust version (with retry)
   */
  public async turnOffRobust(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'auto'
  ): Promise<RetryResult<tplinkTapoConnectWrapperType.tapoConnectResults>> {
    const handler = this.retryHandler || TapoRetryHandler.forDeviceControl();
    
    return handler.execute(
      () => this.wrapper.setTapoTurnOff(email, password, ip, deviceType),
      'turnOff'
    );
  }

  /**
   * Get energy usage - basic version (fast, no retry)
   */
  public async getEnergyUsage(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'P110'
  ): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
    return this.wrapper.getTapoEnergyUsage(email, password, ip, deviceType);
  }

  /**
   * Get energy usage - robust version (with retry)
   */
  public async getEnergyUsageRobust(
    email: string, 
    password: string, 
    ip: string, 
    deviceType: TapoDeviceType = 'P110'
  ): Promise<RetryResult<tplinkTapoConnectWrapperType.tapoConnectResults>> {
    const handler = this.retryHandler || TapoRetryHandler.forEnergyMonitoring();
    
    return handler.execute(
      () => this.wrapper.getTapoEnergyUsage(email, password, ip, deviceType),
      'getEnergyUsage'
    );
  }

  /**
   * Configurable method - user decides retry behavior per call
   */
  public async executeWithOptions<T>(
    operation: () => Promise<T>,
    options: {
      useRetry?: boolean;
      retryConfig?: RetryConfig;
      operationName?: string;
    } = {}
  ): Promise<T | RetryResult<T>> {
    if (options.useRetry || this.enableRetryByDefault) {
      const handler = options.retryConfig 
        ? new TapoRetryHandler(options.retryConfig)
        : this.retryHandler || new TapoRetryHandler();
      
      return handler.execute(operation, options.operationName || 'customOperation');
    }

    return operation();
  }

  /**
   * Batch operations with smart delays to prevent KLAP -1012 errors
   */
  public async executeBatch(
    operations: Array<{
      operation: () => Promise<any>;
      name: string;
      delayAfter?: number;
    }>,
    options: {
      useRetry?: boolean;
      retryConfig?: RetryConfig;
      defaultDelay?: number;
    } = {}
  ): Promise<Array<{ name: string; success: boolean; data?: any; error?: Error; metadata?: any }>> {
    const results: Array<{ name: string; success: boolean; data?: any; error?: Error; metadata?: any }> = [];
    const defaultDelay = options.defaultDelay || 2000;

    for (let i = 0; i < operations.length; i++) {
      const operationItem = operations[i];
      if (!operationItem) continue;
      
      const { operation, name, delayAfter } = operationItem;
      
      try {
        console.log(`\\n--- Executing batch operation: ${name} ---`);
        
        if (options.useRetry) {
          const handler = options.retryConfig 
            ? new TapoRetryHandler(options.retryConfig)
            : this.retryHandler || new TapoRetryHandler();
          
          const result = await handler.execute(operation, name);
          const resultEntry: { name: string; success: boolean; data?: any; error?: Error; metadata?: any } = {
            name,
            success: result.success,
            data: result.data,
            metadata: result.metadata
          };
          
          if (result.error) {
            resultEntry.error = result.error;
          }
          
          results.push(resultEntry);
        } else {
          const data = await operation();
          results.push({ name, success: true, data });
        }

        // Add delay after operation (except for the last one)
        if (i < operations.length - 1) {
          const delay = delayAfter !== undefined ? delayAfter : defaultDelay;
          if (delay > 0) {
            console.log(`⏳ Waiting ${delay}ms before next operation...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

      } catch (error) {
        results.push({ 
          name, 
          success: false, 
          error: error as Error 
        });
      }
    }

    return results;
  }

  /**
   * Create a pre-configured wrapper for specific use cases
   */
  public static forReliability(customRetryConfig?: Partial<RetryConfig>): EnhancedTapoWrapper {
    return new EnhancedTapoWrapper({
      enableRetryByDefault: true,
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 3000,
        strategy: 'linear',
        busyErrorPatterns: ['klap -1012', 'device busy', 'command timing issue'],
        sessionErrorPatterns: ['klap 1002', 'session expired', 'invalid terminal uuid'],
        onRetry: (attempt, error, delay) => {
          console.log(`🔄 Retry ${attempt}: ${error.message.substring(0, 50)}... (waiting ${delay}ms)`);
        },
        ...customRetryConfig
      }
    });
  }

  /**
   * Create a pre-configured wrapper for speed (no retry by default)
   */
  public static forSpeed(): EnhancedTapoWrapper {
    return new EnhancedTapoWrapper({
      enableRetryByDefault: false
    });
  }
}

export default EnhancedTapoWrapper;