import { TapoConnect } from '../../src';
import { TEST_CONFIG, TEST_CREDENTIALS } from '../test-config';

describe('Simple Integration Tests', () => {
  // Skip unless real device testing is enabled
  const testIf = TEST_CONFIG.REAL_DEVICE_TESTS ? test : test.skip;

  testIf('should connect to P100 device', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P100.ip;
    
    const device = await TapoConnect.createP100Plug(deviceIp, TEST_CREDENTIALS);
    expect(device).toBeDefined();
    
    const info = await device.getDeviceInfo();
    expect(info.device_id).toBeTruthy();
    expect(info.model).toBe('P100');
  }, 15000);

  testIf('should control P100 device', async () => {
    const deviceIp = TEST_CONFIG.TEST_DEVICES.P100.ip;
    
    const device = await TapoConnect.createP100Plug(deviceIp, TEST_CREDENTIALS);
    
    await device.turnOn();
    let info = await device.getDeviceInfo();
    expect(info.device_on).toBe(true);
    
    await device.turnOff();
    info = await device.getDeviceInfo();
    expect(info.device_on).toBe(false);
  }, 15000);

  describe('Mock Integration Tests', () => {
    test('should create device with mocked connection', async () => {
      // Mock TapoConnect to avoid actual network calls
      const mockDevice = {
        turnOn: jest.fn().mockResolvedValue(undefined),
        turnOff: jest.fn().mockResolvedValue(undefined),
        getDeviceInfo: jest.fn().mockResolvedValue({
          device_id: 'mock-device-id',
          model: 'P100',
          type: 'SMART.TAPOPLUG',
          device_on: false
        })
      };

      // Simulate successful connection
      jest.spyOn(TapoConnect, 'createP100Plug').mockResolvedValue(mockDevice as any);

      const device = await TapoConnect.createP100Plug('192.168.1.100', TEST_CREDENTIALS);
      
      expect(device).toBeDefined();
      
      const info = await device.getDeviceInfo();
      expect(info.model).toBe('P100');
      
      await device.turnOn();
      expect(mockDevice.turnOn).toHaveBeenCalled();
    });
  });
});