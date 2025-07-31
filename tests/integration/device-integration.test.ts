// Integration tests for device operations
// These tests require actual devices and should be run separately

import { TapoConnect, TapoCredentials } from '../../src';

describe('Device Integration Tests', () => {
  let credentials: TapoCredentials;

  beforeAll(() => {
    credentials = {
      username: process.env.TAPO_USERNAME || 'test-user',
      password: process.env.TAPO_PASSWORD || 'test-password'
    };
  });

  // Skip these tests unless specifically requested
  describe.skip('Real Device Tests', () => {
    test('should connect to real P100 plug', async () => {
      const deviceIp = process.env.P100_IP;
      if (!deviceIp) {
        console.log('P100_IP not set, skipping real device test');
        return;
      }

      const plug = await TapoConnect.createP100Plug(deviceIp, credentials);
      expect(plug).toBeDefined();
      
      const deviceInfo = await plug.getDeviceInfo();
      expect(deviceInfo.success).toBe(true);
    }, 30000);

    test('should connect to real L510 bulb', async () => {
      const deviceIp = process.env.L510_IP;
      if (!deviceIp) {
        console.log('L510_IP not set, skipping real device test');
        return;
      }

      const bulb = await TapoConnect.createL510Bulb(deviceIp, credentials);
      expect(bulb).toBeDefined();
      
      const deviceInfo = await bulb.getDeviceInfo();
      expect(deviceInfo.success).toBe(true);
    }, 30000);
  });
});
