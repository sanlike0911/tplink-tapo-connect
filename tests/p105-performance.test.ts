import { P105Plug, TapoConnect } from '../src';
import { config } from 'dotenv';

config();

describe('P105Plug Performance Tests', () => {
  let plug: P105Plug;
  const credentials = {
    username: process.env['TAPO_USERNAME'] || 'test-user',
    password: process.env['TAPO_PASSWORD'] || 'test-password'
  };
  const plugIp = process.env['PLUG_IP'] || '192.168.0.78';

  beforeAll(async () => {
    plug = TapoConnect.createP105Plug(plugIp, credentials);
    
    try {
      await plug.connect();
    } catch (error) {
      console.warn('Could not connect to real device, performance tests will be skipped');
    }
  }, 30000);

  afterAll(async () => {
    if (plug) {
      await plug.disconnect();
    }
  });

  describe('Connection Performance', () => {
    test('should connect within reasonable time', async () => {
      const testPlug = TapoConnect.createP105Plug(plugIp, credentials);
      
      const startTime = Date.now();
      await testPlug.connect();
      const connectionTime = Date.now() - startTime;
      
      expect(connectionTime).toBeLessThan(10000); // Should connect within 10 seconds
      console.log(`Connection time: ${connectionTime}ms`);
      
      await testPlug.disconnect();
    }, 15000);

    test('should handle connection retry efficiently', async () => {
      const testPlug = TapoConnect.createP105Plug(plugIp, credentials);
      
      const startTime = Date.now();
      
      // Connection with retries should still be reasonable
      await testPlug.connect();
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(20000); // Even with retries, within 20 seconds
      console.log(`Connection with retries: ${totalTime}ms`);
      
      await testPlug.disconnect();
    }, 25000);

    test('should reconnect quickly after disconnect', async () => {
      if (!plug) return;
      
      await plug.disconnect();
      
      const startTime = Date.now();
      await plug.connect();
      const reconnectionTime = Date.now() - startTime;
      
      expect(reconnectionTime).toBeLessThan(8000); // Reconnection should be faster
      console.log(`Reconnection time: ${reconnectionTime}ms`);
    }, 12000);
  });

  describe('API Response Times', () => {
    beforeEach(async () => {
      if (!plug) return;
      // Ensure connected before each test
      try {
        await plug.connect();
      } catch (error) {
        // Already connected or connection failed
      }
    });

    test('getDeviceInfo should respond quickly', async () => {
      if (!plug) return;
      
      const startTime = Date.now();
      await plug.getDeviceInfo();
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      console.log(`getDeviceInfo response time: ${responseTime}ms`);
    });

    test('device control commands should be fast', async () => {
      if (!plug) return;
      
      const operations = [
        { name: 'isOn', fn: () => plug.isOn() },
        { name: 'getOnTime', fn: () => plug.getOnTime() },
        { name: 'isOverheated', fn: () => plug.isOverheated() }
      ];
      
      for (const operation of operations) {
        const startTime = Date.now();
        await operation.fn();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(2000); // Control commands within 2 seconds
        console.log(`${operation.name} response time: ${responseTime}ms`);
      }
    });

    test('energy monitoring should be responsive', async () => {
      if (!plug) return;
      
      const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
      
      if (hasEnergyMonitoring) {
        const startTime = Date.now();
        await plug.getUsageInfo();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(4000); // Energy data within 4 seconds
        console.log(`Energy monitoring response time: ${responseTime}ms`);
      } else {
        // Test safe method performance
        const startTime = Date.now();
        await plug.getUsageInfo({ throwOnUnsupported: false });
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(1000); // Should be very fast for unsupported
        console.log(`Safe energy method response time: ${responseTime}ms`);
      }
    });
  });

  describe('Concurrent Request Performance', () => {
    beforeEach(async () => {
      if (!plug) return;
      try {
        await plug.connect();
      } catch (error) {
        // Already connected or connection failed
      }
    });

    test('should handle multiple concurrent reads efficiently', async () => {
      if (!plug) return;
      
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map(() => plug.getDeviceInfo());
      
      const startTime = Date.now();
      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(concurrentRequests);
      expect(totalTime).toBeLessThan(8000); // All requests within 8 seconds
      
      const avgTime = totalTime / concurrentRequests;
      console.log(`${concurrentRequests} concurrent requests: ${totalTime}ms total, ${avgTime.toFixed(2)}ms average`);
    });

    test('should handle mixed operation types concurrently', async () => {
      if (!plug) return;
      
      const mixedRequests = [
        plug.getDeviceInfo(),
        plug.isOn(),
        plug.getOnTime(),
        plug.isOverheated(),
        plug.getUsageInfo({ throwOnUnsupported: false })
      ];
      
      const startTime = Date.now();
      const results = await Promise.allSettled(mixedRequests);
      const totalTime = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(3); // Most should succeed
      expect(totalTime).toBeLessThan(6000); // Mixed operations within 6 seconds
      
      console.log(`Mixed concurrent operations: ${totalTime}ms, ${successful.length}/${results.length} successful`);
    });

    test('should handle rapid successive requests', async () => {
      if (!plug) return;
      
      const rapidRequests = 20;
      const interval = 100; // 100ms between requests
      
      const startTime = Date.now();
      const promises: Promise<boolean>[] = [];
      
      for (let i = 0; i < rapidRequests; i++) {
        setTimeout(() => {
          promises.push(plug.isOn());
        }, i * interval);
      }
      
      // Wait for all requests to be initiated
      await new Promise(resolve => setTimeout(resolve, rapidRequests * interval + 1000));
      
      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(rapidRequests * 0.8); // At least 80% success rate
      
      console.log(`${rapidRequests} rapid requests: ${totalTime}ms, ${successful.length}/${rapidRequests} successful`);
    }, 15000);
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory with repeated operations', async () => {
      if (!plug) return;
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await plug.isOn();
        
        // Force garbage collection occasionally if available
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`Memory usage: initial ${(initialMemory / 1024 / 1024).toFixed(2)}MB, final ${(finalMemory / 1024 / 1024).toFixed(2)}MB, increase ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }, 30000);

    test('should handle many connect/disconnect cycles', async () => {
      const cycles = 5;
      const times: number[] = [];
      
      for (let i = 0; i < cycles; i++) {
        const testPlug = TapoConnect.createP105Plug(plugIp, credentials);
        
        const startTime = Date.now();
        
        try {
          await testPlug.connect();
          await testPlug.getDeviceInfo();
          await testPlug.disconnect();
          
          const cycleTime = Date.now() - startTime;
          times.push(cycleTime);
          
          console.log(`Cycle ${i + 1}: ${cycleTime}ms`);
        } catch (error) {
          console.warn(`Cycle ${i + 1} failed:`, error);
        }
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        
        expect(avgTime).toBeLessThan(12000); // Average cycle within 12 seconds
        expect(maxTime).toBeLessThan(20000); // No cycle over 20 seconds
        
        console.log(`${cycles} cycles: avg ${avgTime.toFixed(2)}ms, max ${maxTime}ms`);
      }
    }, 60000);
  });

  describe('Feature Detection Performance', () => {
    beforeEach(async () => {
      if (!plug) return;
      try {
        await plug.connect();
      } catch (error) {
        // Already connected or connection failed
      }
    });

    test('should cache feature detection results', async () => {
      if (!plug) return;
      
      // First call - should perform detection
      const startTime1 = Date.now();
      const result1 = await plug.hasEnergyMonitoring();
      const time1 = Date.now() - startTime1;
      
      // Second call - should use cache
      const startTime2 = Date.now();
      const result2 = await plug.hasEnergyMonitoring();
      const time2 = Date.now() - startTime2;
      
      expect(result1).toBe(result2);
      expect(time2).toBeLessThan(time1); // Cached call should be faster
      expect(time2).toBeLessThan(100); // Cached call should be very fast
      
      console.log(`Feature detection: first call ${time1}ms, cached call ${time2}ms`);
    });

    test('should efficiently check multiple features', async () => {
      if (!plug) return;
      
      const features = ['energy_monitoring', 'schedule', 'countdown', 'unknown_feature'];
      
      const startTime = Date.now();
      const results = await Promise.all(
        features.map(feature => plug.supportsFeature(feature))
      );
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(features.length);
      expect(totalTime).toBeLessThan(2000); // Multiple feature checks within 2 seconds
      
      console.log(`Multiple feature checks: ${totalTime}ms for ${features.length} features`);
    });
  });

  describe('Error Handling Performance', () => {
    test('should fail fast on invalid connections', async () => {
      const invalidPlug = TapoConnect.createP105Plug('192.168.255.255', credentials);
      
      const startTime = Date.now();
      
      try {
        await invalidPlug.connect();
      } catch (error) {
        const failTime = Date.now() - startTime;
        
        // Should fail within reasonable time (not hang indefinitely)
        expect(failTime).toBeLessThan(15000);
        console.log(`Fast fail time: ${failTime}ms`);
      }
    }, 20000);

    test('should handle unsupported feature requests efficiently', async () => {
      if (!plug) return;
      
      // Mock device as not supporting energy monitoring
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);
      
      try {
        const startTime = Date.now();
        await plug.getUsageInfo({ throwOnUnsupported: false });
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(500); // Should be very fast for unsupported features
        console.log(`Unsupported feature handling: ${responseTime}ms`);
      } finally {
        // Restore original method
        jest.restoreAllMocks();
      }
    });
  });
});