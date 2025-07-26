import { P105Plug, TapoConnect, TapoCredentials, FeatureNotSupportedError } from '../src';
import { config } from 'dotenv';

config();

describe('P105Plug Integration Tests', () => {
  let plug: P105Plug;
  let credentials: TapoCredentials;
  let plugIp: string;

  beforeAll(() => {
    credentials = {
      username: process.env['TAPO_USERNAME'] || 'test-user',
      password: process.env['TAPO_PASSWORD'] || 'test-password'
    };
    plugIp = process.env['PLUG_IP'] || '192.168.0.78';
    plug = TapoConnect.createP105Plug(plugIp, credentials);
  });

  afterAll(async () => {
    if (plug) {
      await plug.disconnect();
    }
  });

  describe('Connection Tests', () => {
    test('should connect to device successfully', async () => {
      await expect(plug.connect()).resolves.not.toThrow();
    }, 30000);

    test('should handle connection to non-existent device', async () => {
      const invalidPlug = TapoConnect.createP105Plug('192.168.255.255', credentials);
      await expect(invalidPlug.connect()).rejects.toThrow();
    }, 15000);
  });

  describe('Device Information Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should get device info with correct structure', async () => {
      const deviceInfo = await plug.getDeviceInfo();
      
      expect(deviceInfo).toBeDefined();
      expect(deviceInfo.device_id).toBeDefined();
      expect(deviceInfo.model).toBeDefined();
      expect(deviceInfo.device_on).toBeDefined();
      expect(typeof deviceInfo.device_on).toBe('boolean');
      expect(deviceInfo.fw_ver).toBeDefined();
      expect(deviceInfo.hw_ver).toBeDefined();
      expect(deviceInfo.mac).toBeDefined();
      expect(deviceInfo.ip).toBe(plugIp);
    });

    test('should get device status', async () => {
      const isOn = await plug.isOn();
      expect(typeof isOn).toBe('boolean');
    });

    test('should get on time', async () => {
      const onTime = await plug.getOnTime();
      expect(typeof onTime).toBe('number');
      expect(onTime).toBeGreaterThanOrEqual(0);
    });

    test('should get overheated status', async () => {
      const overheated = await plug.isOverheated();
      expect(typeof overheated).toBe('boolean');
    });
  });

  describe('Device Control Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should turn device on and off', async () => {
      const initialState = await plug.isOn();
      
      // Turn on
      await plug.turnOn();
      await new Promise(resolve => setTimeout(resolve, 1000));
      let currentState = await plug.isOn();
      expect(currentState).toBe(true);

      // Turn off
      await plug.turnOff();
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentState = await plug.isOn();
      expect(currentState).toBe(false);

      // Restore initial state
      if (initialState) {
        await plug.turnOn();
      }
    }, 15000);

    test('should toggle device state', async () => {
      const initialState = await plug.isOn();
      
      await plug.toggle();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newState = await plug.isOn();
      expect(newState).toBe(!initialState);

      // Toggle back to restore initial state
      await plug.toggle();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const restoredState = await plug.isOn();
      expect(restoredState).toBe(initialState);
    }, 15000);
  });

  describe('Feature Detection Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should detect energy monitoring support', async () => {
      const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
      expect(typeof hasEnergyMonitoring).toBe('boolean');
    });

    test('should check various feature support', async () => {
      const energySupport = await plug.supportsFeature('energy_monitoring');
      const scheduleSupport = await plug.supportsFeature('schedule');
      const countdownSupport = await plug.supportsFeature('countdown');
      const unknownFeature = await plug.supportsFeature('unknown_feature');

      expect(typeof energySupport).toBe('boolean');
      expect(scheduleSupport).toBe(true); // Most devices support scheduling
      expect(countdownSupport).toBe(true); // Most devices support countdown
      expect(unknownFeature).toBe(false);
    });
  });

  describe('Energy Monitoring Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should handle energy monitoring gracefully based on device capability', async () => {
      const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
      
      if (hasEnergyMonitoring) {
        // Device supports energy monitoring
        const usageInfo = await plug.getUsageInfo();
        expect(usageInfo).toBeDefined();
        expect(typeof usageInfo.currentPower).toBe('number');
        expect(typeof usageInfo.todayEnergy).toBe('number');
        expect(typeof usageInfo.todayRuntime).toBe('number');

        const currentPower = await plug.getCurrentPower();
        expect(typeof currentPower).toBe('number');
      } else {
        // Device doesn't support energy monitoring
        await expect(plug.getUsageInfo()).rejects.toThrow(FeatureNotSupportedError);
        await expect(plug.getCurrentPower()).rejects.toThrow(FeatureNotSupportedError);
      }
    });

    test('should use options parameter correctly', async () => {
      // Test with throwOnUnsupported: false
      const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
      expect(usageInfo).toBeDefined();
      expect(typeof usageInfo.currentPower).toBe('number');

      const currentPower = await plug.getCurrentPower({ throwOnUnsupported: false });
      expect(typeof currentPower).toBe('number');

      const todayEnergy = await plug.getTodayEnergy({ throwOnUnsupported: false });
      expect(typeof todayEnergy).toBe('number');
    });

    test('should use Result pattern correctly', async () => {
      const result = await plug.getUsageInfoResult();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(typeof result.data.currentPower).toBe('number');
      } else {
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Error Handling Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should handle invalid device info parameters', async () => {
      await expect(plug.setDeviceInfo({ invalid_param: 'test' })).rejects.toThrow();
    });

    test('should handle network timeout scenarios', async () => {
      const timeoutPlug = TapoConnect.createP105Plug(plugIp, credentials);
      await timeoutPlug.connect();
      
      // Test with very short timeout (if supported)
      const usageInfo = await timeoutPlug.getUsageInfo({ 
        throwOnUnsupported: false,
        timeout: 1000 
      });
      expect(usageInfo).toBeDefined();
      
      await timeoutPlug.disconnect();
    }, 10000);
  });

  describe('Authentication Protocol Tests', () => {
    test('should handle both KLAP and Secure Passthrough protocols', async () => {
      const testPlug = TapoConnect.createP105Plug(plugIp, credentials);
      
      // Test multiple connection attempts to verify protocol fallback
      await testPlug.connect();
      const deviceInfo1 = await testPlug.getDeviceInfo();
      await testPlug.disconnect();

      await testPlug.connect();
      const deviceInfo2 = await testPlug.getDeviceInfo();
      await testPlug.disconnect();

      expect(deviceInfo1.device_id).toBe(deviceInfo2.device_id);
    }, 30000);

    test('should handle authentication retry logic', async () => {
      const retryPlug = TapoConnect.createP105Plug(plugIp, credentials);
      
      // Connection should succeed even with potential initial failures
      await expect(retryPlug.connect()).resolves.not.toThrow();
      await retryPlug.disconnect();
    }, 20000);
  });

  describe('Concurrent Operation Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should handle concurrent device info requests', async () => {
      const requests = Array(5).fill(null).map(() => plug.getDeviceInfo());
      const results = await Promise.all(requests);
      
      results.forEach((result: any) => {
        expect(result).toBeDefined();
        expect(result.device_id).toBe(results[0]?.device_id);
      });
    });

    test('should handle concurrent control operations safely', async () => {
      const initialState = await plug.isOn();
      
      // Multiple status checks should be consistent
      const statusChecks = Array(3).fill(null).map(() => plug.isOn());
      const statuses = await Promise.all(statusChecks);
      
      statuses.forEach((status: any) => {
        expect(status).toBe(initialState);
      });
    }, 10000);
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should respond to device info requests within reasonable time', async () => {
      const startTime = Date.now();
      await plug.getDeviceInfo();
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test('should handle rapid successive requests', async () => {
      const requests = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        requests.push(plug.isOn());
      }
      
      const results = await Promise.all(requests);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    }, 15000);
  });

  describe('Data Validation Tests', () => {
    beforeEach(async () => {
      await plug.connect();
    });

    test('should return valid device info structure', async () => {
      const deviceInfo = await plug.getDeviceInfo();
      
      // Check required properties
      expect(deviceInfo.device_id).toMatch(/^[A-F0-9]+$/);
      expect(deviceInfo.model).toBe('P105');
      expect(deviceInfo.fw_ver).toMatch(/^\d+\.\d+\.\d+/);
      expect(deviceInfo.hw_ver).toMatch(/^\d+\.\d+\.\d+$/);
      expect(deviceInfo.mac).toMatch(/^([A-F0-9]{2}[:-]){5}[A-F0-9]{2}$/i);
      expect(deviceInfo.ip).toBe(plugIp);
    });

    test('should return consistent device data across calls', async () => {
      const info1 = await plug.getDeviceInfo();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const info2 = await plug.getDeviceInfo();
      
      // Static properties should remain the same
      expect(info1.device_id).toBe(info2.device_id);
      expect(info1.model).toBe(info2.model);
      expect(info1.fw_ver).toBe(info2.fw_ver);
      expect(info1.hw_ver).toBe(info2.hw_ver);
      expect(info1.mac).toBe(info2.mac);
    });
  });
});