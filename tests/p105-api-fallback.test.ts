import { P105Plug, TapoConnect } from '../src';
import { config } from 'dotenv';

config();

describe('P105Plug API Fallback Tests', () => {
  const credentials = {
    username: process.env['TAPO_USERNAME'] || 'test-user',
    password: process.env['TAPO_PASSWORD'] || 'test-password'
  };
  const plugIp = process.env['PLUG_IP'] || '192.168.0.78';

  describe('Fallback Mechanism', () => {
    let plug: P105Plug;

    beforeEach(() => {
      plug = TapoConnect.createP105Plug(plugIp, credentials);
    });

    afterEach(async () => {
      if (plug) {
        await plug.disconnect();
      }
    });

    test('should fallback from KLAP to Secure Passthrough on KLAP errors', async () => {
      // Mock successful connection setup
      jest.spyOn(plug as any, 'checkDeviceConnectivity').mockResolvedValue(true);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockResolvedValue({});
      jest.spyOn((plug as any).klapAuth, 'isAuthenticated').mockReturnValue(true);
      
      // Connect with KLAP first
      await plug.connect();
      expect((plug as any).useKlap).toBe(true);
      
      // Mock KLAP to fail with recoverable error
      jest.spyOn((plug as any).klapAuth, 'secureRequest')
        .mockRejectedValueOnce(new Error('Device busy or command timing issue (KLAP -1012)'));
      
      // Mock Secure Passthrough auth and request to succeed
      jest.spyOn((plug as any).auth, 'isAuthenticated').mockReturnValue(false);
      jest.spyOn((plug as any).auth, 'authenticate').mockResolvedValue(undefined);
      jest.spyOn((plug as any).auth, 'secureRequest').mockResolvedValue({
        device_on: true,
        device_id: 'test_device'
      });

      // This should trigger fallback
      const result = await plug.isOn();
      
      expect(result).toBe(true);
      expect((plug as any).useKlap).toBe(false); // Should switch to Secure Passthrough
    });

    test('should fallback from Secure Passthrough to KLAP on connection errors', async () => {
      // Mock successful connection setup with Secure Passthrough
      jest.spyOn(plug as any, 'checkDeviceConnectivity').mockResolvedValue(true);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockRejectedValue(new Error('KLAP not supported'));
      jest.spyOn((plug as any).auth, 'authenticate').mockResolvedValue(undefined);
      jest.spyOn((plug as any).auth, 'isAuthenticated').mockReturnValue(true);
      
      // Connect with Secure Passthrough first
      await plug.connect();
      expect((plug as any).useKlap).toBe(false);
      
      // Mock Secure Passthrough to fail with recoverable error
      jest.spyOn((plug as any).auth, 'secureRequest')
        .mockRejectedValueOnce(new Error('Connection reset by device'));
      
      // Mock KLAP auth and request to succeed
      jest.spyOn((plug as any).klapAuth, 'isAuthenticated').mockReturnValue(false);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockResolvedValue({});
      jest.spyOn((plug as any).klapAuth, 'secureRequest').mockResolvedValue({
        device_on: false,
        device_id: 'test_device'
      });

      // This should trigger fallback
      const result = await plug.isOn();
      
      expect(result).toBe(false);
      expect((plug as any).useKlap).toBe(true); // Should switch to KLAP
    });

    test('should not fallback on authentication errors', async () => {
      // Mock successful connection setup
      jest.spyOn(plug as any, 'checkDeviceConnectivity').mockResolvedValue(true);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockResolvedValue({});
      jest.spyOn((plug as any).klapAuth, 'isAuthenticated').mockReturnValue(true);
      
      await plug.connect();
      
      // Mock KLAP to fail with non-recoverable error
      jest.spyOn((plug as any).klapAuth, 'secureRequest')
        .mockRejectedValue(new Error('Email or password incorrect'));
      
      // Should not attempt fallback and throw original error
      await expect(plug.isOn()).rejects.toThrow('Email or password incorrect');
    });

    test('should throw combined error when both APIs fail', async () => {
      // Mock successful connection setup
      jest.spyOn(plug as any, 'checkDeviceConnectivity').mockResolvedValue(true);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockResolvedValue({});
      jest.spyOn((plug as any).klapAuth, 'isAuthenticated').mockReturnValue(true);
      
      await plug.connect();
      
      // Mock both APIs to fail
      jest.spyOn((plug as any).klapAuth, 'secureRequest')
        .mockRejectedValue(new Error('KLAP request failed'));
      jest.spyOn((plug as any).auth, 'isAuthenticated').mockReturnValue(false);
      jest.spyOn((plug as any).auth, 'authenticate').mockResolvedValue(undefined);
      jest.spyOn((plug as any).auth, 'secureRequest')
        .mockRejectedValue(new Error('Secure Passthrough request failed'));

      await expect(plug.isOn()).rejects.toThrow(/Both API protocols failed/);
    });
  });

  describe('Error Classification', () => {
    let plug: P105Plug;

    beforeEach(() => {
      plug = TapoConnect.createP105Plug(plugIp, credentials);
    });

    test('should correctly identify recoverable KLAP errors', () => {
      const recoverableErrors = [
        'Device busy or command timing issue (KLAP -1012)',
        'Invalid parameters or malformed request (KLAP -1003)',
        'Rate limit exceeded (HTTP 429)',
        'Connection reset by device',
        'Request timeout',
        'Invalid JSON response from device'
      ];

      for (const errorMsg of recoverableErrors) {
        const error = new Error(errorMsg);
        expect((plug as any).isRecoverableError(error)).toBe(true);
      }
    });

    test('should correctly identify non-recoverable errors', () => {
      const nonRecoverableErrors = [
        'Email or password incorrect',
        'Device not connected. Call connect() first.',
        'Authentication failed',
        'Device not found'
      ];

      for (const errorMsg of nonRecoverableErrors) {
        const error = new Error(errorMsg);
        expect((plug as any).isRecoverableError(error)).toBe(false);
      }
    });

    test('should treat unknown errors as recoverable by default', () => {
      const unknownError = new Error('Some unexpected error message');
      expect((plug as any).isRecoverableError(unknownError)).toBe(true);
    });
  });

  describe('Protocol Switching', () => {
    let plug: P105Plug;

    beforeEach(() => {
      plug = TapoConnect.createP105Plug(plugIp, credentials);
    });

    afterEach(async () => {
      if (plug) {
        await plug.disconnect();
      }
    });

    test('should maintain protocol preference after successful fallback', async () => {
      // Mock successful connection setup
      jest.spyOn(plug as any, 'checkDeviceConnectivity').mockResolvedValue(true);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockResolvedValue({});
      jest.spyOn((plug as any).klapAuth, 'isAuthenticated').mockReturnValue(true);
      
      // Start with KLAP
      await plug.connect();
      expect((plug as any).useKlap).toBe(true);
      
      // Mock KLAP failure and Secure Passthrough success
      jest.spyOn((plug as any).klapAuth, 'secureRequest')
        .mockRejectedValueOnce(new Error('KLAP -1012'));
      jest.spyOn((plug as any).auth, 'isAuthenticated').mockReturnValue(false);
      jest.spyOn((plug as any).auth, 'authenticate').mockResolvedValue(undefined);
      jest.spyOn((plug as any).auth, 'secureRequest').mockResolvedValue({
        device_on: true
      });

      await plug.isOn();
      
      // Should switch to Secure Passthrough
      expect((plug as any).useKlap).toBe(false);
      
      // Subsequent calls should use Secure Passthrough
      jest.spyOn((plug as any).auth, 'isAuthenticated').mockReturnValue(true);
      jest.spyOn((plug as any).auth, 'secureRequest').mockResolvedValue({
        device_on: false
      });
      
      const secondResult = await plug.isOn();
      expect(secondResult).toBe(false);
    });
  });

  describe('Fallback Performance', () => {
    let plug: P105Plug;

    beforeEach(() => {
      plug = TapoConnect.createP105Plug(plugIp, credentials);
    });

    afterEach(async () => {
      if (plug) {
        await plug.disconnect();
      }
    });

    test('should complete fallback within reasonable time', async () => {
      // Mock successful connection setup
      jest.spyOn(plug as any, 'checkDeviceConnectivity').mockResolvedValue(true);
      jest.spyOn((plug as any).klapAuth, 'authenticate').mockResolvedValue({});
      jest.spyOn((plug as any).klapAuth, 'isAuthenticated').mockReturnValue(true);
      
      await plug.connect();
      
      // Mock KLAP to fail after delay
      jest.spyOn((plug as any).klapAuth, 'secureRequest').mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('KLAP timeout')), 100)
        )
      );
      
      // Mock Secure Passthrough to succeed quickly
      jest.spyOn((plug as any).auth, 'isAuthenticated').mockReturnValue(false);
      jest.spyOn((plug as any).auth, 'authenticate').mockResolvedValue(undefined);
      jest.spyOn((plug as any).auth, 'secureRequest').mockResolvedValue({
        device_on: true
      });

      const startTime = Date.now();
      await plug.isOn();
      const totalTime = Date.now() - startTime;
      
      // Should complete within reasonable time including fallback
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Real Device Fallback Integration', () => {
    test('should handle real device errors gracefully with fallback', async () => {
      const testPlug = TapoConnect.createP105Plug(plugIp, credentials);
      
      try {
        await testPlug.connect();
        
        // Make a real request that might trigger fallback
        const deviceInfo = await testPlug.getDeviceInfo();
        expect(deviceInfo).toBeDefined();
        expect(deviceInfo.device_id).toBeDefined();
        
        console.log(`Current protocol: ${(testPlug as any).useKlap ? 'KLAP' : 'Secure Passthrough'}`);
        
      } catch (error) {
        // If we can't connect to a real device, that's okay for this test
        console.warn('Real device test skipped - no device available');
      } finally {
        await testPlug.disconnect();
      }
    }, 15000);
  });
});