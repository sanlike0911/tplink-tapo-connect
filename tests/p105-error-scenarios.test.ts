import { P105Plug, TapoConnect, FeatureNotSupportedError, DeviceCapabilityError } from '../src';
import { config } from 'dotenv';

config();

describe('P105Plug Error Scenarios Tests', () => {
  const mockCredentials = {
    username: 'test-user',
    password: 'test-password'
  };

  describe('Invalid Device Connection', () => {
    test('should handle non-existent IP address', async () => {
      const invalidPlug = TapoConnect.createP105Plug('192.168.255.255', mockCredentials);
      
      await expect(invalidPlug.connect()).rejects.toThrow();
    }, 15000);

    test('should handle invalid port connection', async () => {
      const invalidPlug = TapoConnect.createP105Plug('192.168.1.1:9999', mockCredentials);
      
      await expect(invalidPlug.connect()).rejects.toThrow();
    }, 15000);

    test('should handle malformed IP address', async () => {
      const invalidPlug = TapoConnect.createP105Plug('not.an.ip.address', mockCredentials);
      
      await expect(invalidPlug.connect()).rejects.toThrow();
    }, 15000);

    test('should handle empty IP address', async () => {
      expect(() => {
        TapoConnect.createP105Plug('', mockCredentials);
      }).not.toThrow(); // Should create instance but fail on connect
      
      const emptyIpPlug = TapoConnect.createP105Plug('', mockCredentials);
      await expect(emptyIpPlug.connect()).rejects.toThrow();
    }, 10000);
  });

  describe('Invalid Credentials', () => {
    const validIp = process.env['PLUG_IP'] || '192.168.0.78';

    test('should handle wrong username', async () => {
      const wrongUserPlug = TapoConnect.createP105Plug(validIp, {
        username: 'wrong@user.com',
        password: process.env['TAPO_PASSWORD'] || 'test-password'
      });
      
      await expect(wrongUserPlug.connect()).rejects.toThrow();
    }, 20000);

    test('should handle wrong password', async () => {
      const wrongPassPlug = TapoConnect.createP105Plug(validIp, {
        username: process.env['TAPO_USERNAME'] || 'test-user',
        password: 'wrong-password'
      });
      
      await expect(wrongPassPlug.connect()).rejects.toThrow();
    }, 20000);

    test('should handle empty credentials', async () => {
      const emptyCredPlug = TapoConnect.createP105Plug(validIp, {
        username: '',
        password: ''
      });
      
      await expect(emptyCredPlug.connect()).rejects.toThrow();
    }, 15000);

    test('should handle undefined credentials', async () => {
      expect(() => {
        TapoConnect.createP105Plug(validIp, {
          username: undefined as any,
          password: undefined as any
        });
      }).not.toThrow(); // Should create instance but fail on connect
    });
  });

  describe('Device State Errors', () => {
    let plug: P105Plug;
    
    beforeAll(async () => {
      const credentials = {
        username: process.env['TAPO_USERNAME'] || 'test-user',
        password: process.env['TAPO_PASSWORD'] || 'test-password'
      };
      const plugIp = process.env['PLUG_IP'] || '192.168.0.78';
      plug = TapoConnect.createP105Plug(plugIp, credentials);
      
      try {
        await plug.connect();
      } catch (error) {
        console.warn('Could not connect to real device, skipping device state tests');
        return;
      }
    });

    afterAll(async () => {
      if (plug) {
        await plug.disconnect();
      }
    });

    test('should handle operations on disconnected device', async () => {
      const disconnectedPlug = TapoConnect.createP105Plug('192.168.0.78', {
        username: 'test',
        password: 'test'
      });
      
      await expect(disconnectedPlug.getDeviceInfo()).rejects.toThrow();
      await expect(disconnectedPlug.turnOn()).rejects.toThrow();
      await expect(disconnectedPlug.isOn()).rejects.toThrow();
    });

    test('should handle invalid device info parameters', async () => {
      if (!plug) return; // Skip if no real device connection
      
      await expect(plug.setDeviceInfo({
        invalid_parameter: 'invalid_value',
        another_invalid: 123
      })).rejects.toThrow();
    });

    test('should handle concurrent conflicting operations', async () => {
      if (!plug) return; // Skip if no real device connection
      
      // Start multiple conflicting operations simultaneously
      const operations = [
        plug.turnOn(),
        plug.turnOff(),
        plug.toggle(),
        plug.turnOn()
      ];
      
      // Some operations might fail due to conflicts, but shouldn't crash
      const results = await Promise.allSettled(operations);
      
      // At least some operations should complete
      const fulfilled = results.filter(result => result.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Network Error Scenarios', () => {
    test('should handle network timeout', async () => {
      // This test simulates a slow/unresponsive device
      const timeoutPlug = TapoConnect.createP105Plug('1.1.1.1', mockCredentials);
      
      await expect(timeoutPlug.connect()).rejects.toThrow();
    }, 20000);

    test('should handle connection interruption during operation', async () => {
      // This is harder to test without actually interrupting network
      // But we can test the error handling structure
      const plug = TapoConnect.createP105Plug('192.168.255.254', mockCredentials);
      
      await expect(plug.connect()).rejects.toThrow();
    }, 15000);
  });

  describe('Energy Monitoring Edge Cases', () => {
    let plug: P105Plug;
    
    beforeEach(() => {
      plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
    });

    test('should handle energy monitoring on unsupported device', async () => {
      // Mock a device connection that doesn't support energy monitoring
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);
      
      // Should throw FeatureNotSupportedError by default
      await expect(plug.getUsageInfo()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getCurrentPower()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getTodayEnergy()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getMonthEnergy()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getTodayRuntime()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getMonthRuntime()).rejects.toThrow(FeatureNotSupportedError);
    });

    test('should handle energy monitoring API failures', async () => {
      // Mock a device that should support energy monitoring but API fails
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
      jest.spyOn(plug as any, 'sendRequest').mockRejectedValue(new Error('API Error'));
      
      await expect(plug.getUsageInfo()).rejects.toThrow(DeviceCapabilityError);
    });

    test('should handle corrupted energy monitoring response', async () => {
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: {
          // Missing required fields
          incomplete: 'data'
        }
      });
      
      const usageInfo = await plug.getUsageInfo();
      
      // Should handle missing fields gracefully
      expect(usageInfo.currentPower).toBeUndefined();
      expect(usageInfo.todayEnergy).toBeUndefined();
    });

    test('should handle Result pattern with various error types', async () => {
      // Test FeatureNotSupportedError
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);
      
      let result = await plug.getUsageInfoResult();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(FeatureNotSupportedError);
      }
      
      // Test DeviceCapabilityError
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
      jest.spyOn(plug as any, 'sendRequest').mockRejectedValue(new Error('API Error'));
      
      result = await plug.getUsageInfoResult();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DeviceCapabilityError);
      }
    });
  });

  describe('Data Validation Errors', () => {
    let plug: P105Plug;
    
    beforeEach(() => {
      plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
    });

    test('should handle malformed device info response', async () => {
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: {
          // Malformed response missing required fields
          some_field: 'value'
        }
      });
      
      const deviceInfo = await plug.getDeviceInfo();
      
      // Should handle missing fields with defaults
      expect(deviceInfo.deviceId).toBeDefined();
      expect(deviceInfo.device_on).toBeDefined();
      expect(deviceInfo.deviceType).toBe('SMART.TAPOPLUG');
    });

    test('should handle null/undefined device response', async () => {
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: null
      });
      
      await expect(plug.getDeviceInfo()).rejects.toThrow();
    });

    test('should handle response with wrong data types', async () => {
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: {
          device_id: 123, // Should be string
          device_on: 'yes', // Should be boolean
          fw_ver: null, // Should be string
          model: undefined, // Should be string
          mac: 'invalid-mac-format',
          ip: '192.168.0.78'
        }
      });
      
      const deviceInfo = await plug.getDeviceInfo();
      
      // Should handle type conversion gracefully
      expect(typeof deviceInfo.deviceId).toBe('string');
      expect(typeof deviceInfo.device_on).toBe('boolean');
    });
  });

  describe('Concurrent Access Errors', () => {
    let plug: P105Plug;
    
    beforeEach(() => {
      plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
    });

    test('should handle concurrent authentication attempts', async () => {
      // Mock authentication to simulate real timing
      jest.spyOn(plug as any, 'auth', 'get').mockReturnValue({
        authenticate: () => new Promise(resolve => setTimeout(resolve, 1000)),
        isAuthenticated: () => true,
        clearSession: () => {}
      });
      jest.spyOn(plug as any, 'klapAuth', 'get').mockReturnValue({
        authenticate: () => new Promise(resolve => setTimeout(resolve, 1000)),
        isAuthenticated: () => true,
        clearSession: () => Promise.resolve()
      });
      
      // Start multiple concurrent connections
      const connections = [
        plug.connect(),
        plug.connect(),
        plug.connect()
      ];
      
      // Should handle concurrent connections gracefully
      const results = await Promise.allSettled(connections);
      
      // At least one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    }, 15000);

    test('should handle rapid successive requests', async () => {
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: { device_on: true }
      });
      
      // Send many requests rapidly
      const requests = Array(20).fill(null).map(() => plug.isOn());
      
      const results = await Promise.allSettled(requests);
      
      // Most should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(15);
    });
  });

  describe('Resource Cleanup Errors', () => {
    test('should handle disconnect errors gracefully', async () => {
      const plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
      
      // Mock connection with failing cleanup
      jest.spyOn(plug as any, 'auth', 'get').mockReturnValue({
        clearSession: () => { throw new Error('Cleanup failed'); }
      });
      jest.spyOn(plug as any, 'klapAuth', 'get').mockReturnValue({
        clearSession: () => Promise.reject(new Error('KLAP cleanup failed'))
      });
      
      // Disconnect should not throw even if cleanup fails
      await expect(plug.disconnect()).resolves.not.toThrow();
    });

    test('should handle multiple disconnect calls', async () => {
      const plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
      
      // Multiple disconnects should be safe
      await plug.disconnect();
      await plug.disconnect();
      await expect(plug.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Edge Case Input Validation', () => {
    test('should handle extremely long device IDs', async () => {
      const plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
      
      const longDeviceId = 'A'.repeat(1000);
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: {
          device_id: longDeviceId,
          device_on: true,
          model: 'P105',
          fw_ver: '1.0.0',
          hw_ver: '1.0.0',
          mac: '00:00:00:00:00:00',
          ip: '192.168.0.78'
        }
      });
      
      const deviceInfo = await plug.getDeviceInfo();
      expect(deviceInfo.device_id).toBe(longDeviceId);
    });

    test('should handle special characters in device data', async () => {
      const plug = TapoConnect.createP105Plug('192.168.0.78', mockCredentials);
      
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({
        result: {
          device_id: 'TEST🏠123',
          nickname: 'My テスト Plug 🔌',
          device_on: true,
          model: 'P105',
          fw_ver: '1.0.0',
          hw_ver: '1.0.0',
          mac: '00:00:00:00:00:00',
          ip: '192.168.0.78'
        }
      });
      
      const deviceInfo = await plug.getDeviceInfo();
      expect(deviceInfo.device_id).toBe('TEST🏠123');
      expect(deviceInfo.nickname).toBe('My テスト Plug 🔌');
    });
  });
});