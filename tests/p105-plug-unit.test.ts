import { P105Plug, FeatureNotSupportedError, DeviceCapabilityError } from '../src';

// Mock the core authentication modules
jest.mock('../src/core/auth');
jest.mock('../src/core/klap-auth');

describe('P105Plug Unit Tests', () => {
  let plug: P105Plug;
  const mockCredentials = {
    username: 'test-user',
    password: 'test-password'
  };
  const mockIp = '192.168.1.100';

  beforeEach(() => {
    plug = new P105Plug(mockIp, mockCredentials);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create instance with correct properties', () => {
      expect(plug).toBeInstanceOf(P105Plug);
      expect(plug['ip']).toBe(mockIp);
      expect(plug['credentials']).toEqual(mockCredentials);
    });
  });

  describe('Feature Detection', () => {
    beforeEach(() => {
      // Mock successful connection
      jest.spyOn(plug, 'getDeviceInfo').mockResolvedValue({
        device_id: 'TEST123',
        model: 'P105',
        device_on: true,
        fw_ver: '1.0.0',
        hw_ver: '1.0.0',
        mac: '00:00:00:00:00:00',
        ip: mockIp,
        nickname: 'Test Plug',
        auto_off_remain_time: 0,
        auto_off_status: 'off',
        avatar: 'plug',
        default_states: { type: 'last_states', state: {} },
        fw_id: 'TEST_FW',
        has_set_location_info: false,
        hw_id: 'TEST_HW',
        lang: 'en_US',
        latitude: 0,
        location: '',
        longitude: 0,
        oem_id: 'TEST_OEM',
        on_time: 0,
        overheated: false,
        // Computed properties
        deviceId: 'TEST123',
        deviceOn: true,
        onTime: 0,
        fwVer: '1.0.0',
        hwVer: '1.0.0',
        deviceType: 'SMART.TAPOPLUG',
        type: 'SMART.TAPOPLUG',
        region: 'US',
        specs: '',
        rssi: 0,
        signalLevel: 0
      });
    });

    test('should detect P105 does not support energy monitoring', async () => {
      const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
      expect(hasEnergyMonitoring).toBe(false);
    });

    test('should cache feature detection results', async () => {
      const spy = jest.spyOn(plug, 'getDeviceInfo');
      
      // First call should get device info
      await plug.hasEnergyMonitoring();
      expect(spy).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      await plug.hasEnergyMonitoring();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should support basic features', async () => {
      const scheduleSupport = await plug.supportsFeature('schedule');
      const countdownSupport = await plug.supportsFeature('countdown');
      const unknownFeature = await plug.supportsFeature('unknown');

      expect(scheduleSupport).toBe(true);
      expect(countdownSupport).toBe(true);
      expect(unknownFeature).toBe(false);
    });
  });

  describe('Energy Monitoring Error Handling', () => {
    beforeEach(() => {
      // Mock P105 device info (no energy monitoring)
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(false);
    });

    test('should throw FeatureNotSupportedError by default', async () => {
      await expect(plug.getUsageInfo()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getCurrentPower()).rejects.toThrow(FeatureNotSupportedError);
      await expect(plug.getTodayEnergy()).rejects.toThrow(FeatureNotSupportedError);
    });

    test('should return default values when throwOnUnsupported is false', async () => {
      const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
      expect(usageInfo).toEqual({
        todayRuntime: 0,
        monthRuntime: 0,
        todayEnergy: 0,
        monthEnergy: 0,
        currentPower: 0
      });

      const currentPower = await plug.getCurrentPower({ throwOnUnsupported: false });
      expect(currentPower).toBe(0);

      const todayEnergy = await plug.getTodayEnergy({ throwOnUnsupported: false });
      expect(todayEnergy).toBe(0);
    });

    test('should return Result pattern correctly', async () => {
      const result = await plug.getUsageInfoResult();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(FeatureNotSupportedError);
      }
    });
  });

  describe('Device Control Logic', () => {
    beforeEach(() => {
      // Mock device info for control operations
      jest.spyOn(plug, 'getDeviceInfo').mockResolvedValue({
        device_on: true,
        on_time: 3600,
        overheated: false,
        device_id: 'TEST123',
        model: 'P105',
        fw_ver: '1.0.0',
        hw_ver: '1.0.0',
        mac: '00:00:00:00:00:00',
        ip: mockIp,
        nickname: 'Test Plug',
        auto_off_remain_time: 0,
        auto_off_status: 'off',
        avatar: 'plug',
        default_states: { type: 'last_states', state: {} },
        fw_id: 'TEST_FW',
        has_set_location_info: false,
        hw_id: 'TEST_HW',
        lang: 'en_US',
        latitude: 0,
        location: '',
        longitude: 0,
        oem_id: 'TEST_OEM',
        // Computed properties
        deviceId: 'TEST123',
        deviceOn: true,
        onTime: 3600,
        fwVer: '1.0.0',
        hwVer: '1.0.0',
        deviceType: 'SMART.TAPOPLUG',
        type: 'SMART.TAPOPLUG',
        region: 'US',
        specs: '',
        rssi: 0,
        signalLevel: 0
      });
    });

    test('should return correct device status', async () => {
      const isOn = await plug.isOn();
      expect(isOn).toBe(true);
    });

    test('should return correct on time', async () => {
      const onTime = await plug.getOnTime();
      expect(onTime).toBe(3600);
    });

    test('should return correct overheated status', async () => {
      const overheated = await plug.isOverheated();
      expect(overheated).toBe(false);
    });

    test('should handle missing optional properties', async () => {
      // Mock device info without optional properties
      jest.spyOn(plug, 'getDeviceInfo').mockResolvedValue({
        device_on: true,
        device_id: 'TEST123',
        model: 'P105',
        fw_ver: '1.0.0',
        hw_ver: '1.0.0',
        mac: '00:00:00:00:00:00',
        ip: mockIp,
        nickname: 'Test Plug',
        auto_off_remain_time: 0,
        auto_off_status: 'off',
        avatar: 'plug',
        default_states: { type: 'last_states', state: {} },
        fw_id: 'TEST_FW',
        has_set_location_info: false,
        hw_id: 'TEST_HW',
        lang: 'en_US',
        latitude: 0,
        location: '',
        longitude: 0,
        oem_id: 'TEST_OEM',
        // Computed properties
        deviceId: 'TEST123',
        deviceOn: true,
        onTime: 0,
        fwVer: '1.0.0',
        hwVer: '1.0.0',
        deviceType: 'SMART.TAPOPLUG',
        type: 'SMART.TAPOPLUG',
        region: 'US',
        specs: '',
        rssi: 0,
        signalLevel: 0
      });

      const onTime = await plug.getOnTime();
      const overheated = await plug.isOverheated();

      expect(onTime).toBe(0);
      expect(overheated).toBe(false);
    });
  });

  describe('Toggle Logic', () => {
    let sendRequestSpy: jest.SpyInstance;

    beforeEach(() => {
      sendRequestSpy = jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({ result: {} });
    });

    test('should turn off when device is on', async () => {
      jest.spyOn(plug, 'getDeviceInfo').mockResolvedValue({
        device_on: true,
        device_id: 'TEST123',
        model: 'P105',
        fw_ver: '1.0.0',
        hw_ver: '1.0.0',
        mac: '00:00:00:00:00:00',
        ip: mockIp,
        nickname: 'Test Plug',
        auto_off_remain_time: 0,
        auto_off_status: 'off',
        avatar: 'plug',
        default_states: { type: 'last_states', state: {} },
        fw_id: 'TEST_FW',
        has_set_location_info: false,
        hw_id: 'TEST_HW',
        lang: 'en_US',
        latitude: 0,
        location: '',
        longitude: 0,
        oem_id: 'TEST_OEM',
        on_time: 0,
        overheated: false,
        // Computed properties
        deviceId: 'TEST123',
        deviceOn: true,
        onTime: 0,
        fwVer: '1.0.0',
        hwVer: '1.0.0',
        deviceType: 'SMART.TAPOPLUG',
        type: 'SMART.TAPOPLUG',
        region: 'US',
        specs: '',
        rssi: 0,
        signalLevel: 0
      });

      await plug.toggle();

      expect(sendRequestSpy).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: false }
      });
    });

    test('should turn on when device is off', async () => {
      jest.spyOn(plug, 'getDeviceInfo').mockResolvedValue({
        device_on: false,
        device_id: 'TEST123',
        model: 'P105',
        fw_ver: '1.0.0',
        hw_ver: '1.0.0',
        mac: '00:00:00:00:00:00',
        ip: mockIp,
        nickname: 'Test Plug',
        auto_off_remain_time: 0,
        auto_off_status: 'off',
        avatar: 'plug',
        default_states: { type: 'last_states', state: {} },
        fw_id: 'TEST_FW',
        has_set_location_info: false,
        hw_id: 'TEST_HW',
        lang: 'en_US',
        latitude: 0,
        location: '',
        longitude: 0,
        oem_id: 'TEST_OEM',
        on_time: 0,
        overheated: false,
        // Computed properties
        deviceId: 'TEST123',
        deviceOn: false,
        onTime: 0,
        fwVer: '1.0.0',
        hwVer: '1.0.0',
        deviceType: 'SMART.TAPOPLUG',
        type: 'SMART.TAPOPLUG',
        region: 'US',
        specs: '',
        rssi: 0,
        signalLevel: 0
      });

      await plug.toggle();

      expect(sendRequestSpy).toHaveBeenCalledWith({
        method: 'set_device_info',
        params: { device_on: true }
      });
    });
  });

  describe('Data Transformation', () => {
    test('should transform raw device data correctly', async () => {
      const rawData = {
        device_id: 'RAW123',
        device_on: true,
        fw_ver: '2.0.0',
        hw_ver: '2.0.0',
        on_time: 7200,
        overheated: true,
        model: 'P105',
        mac: '11:22:33:44:55:66',
        ip: mockIp,
        nickname: 'Raw Plug',
        auto_off_remain_time: 0,
        auto_off_status: 'off',
        avatar: 'plug',
        default_states: { type: 'last_states', state: {} },
        fw_id: 'RAW_FW',
        has_set_location_info: true,
        hw_id: 'RAW_HW',
        lang: 'ja_JP',
        latitude: 35.6762,
        location: 'Tokyo',
        longitude: 139.6503,
        oem_id: 'RAW_OEM'
      };

      // Mock the sendRequest to return our raw data
      jest.spyOn(plug as any, 'sendRequest').mockResolvedValue({ result: rawData });

      const deviceInfo = await plug.getDeviceInfo();

      // Check transformation
      expect(deviceInfo.deviceId).toBe('RAW123');
      expect(deviceInfo.deviceOn).toBe(true);
      expect(deviceInfo.onTime).toBe(7200);
      expect(deviceInfo.fwVer).toBe('2.0.0');
      expect(deviceInfo.hwVer).toBe('2.0.0');
      expect(deviceInfo.deviceType).toBe('SMART.TAPOPLUG');
      expect(deviceInfo.region).toBe('JP');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      jest.spyOn(plug as any, 'sendRequest').mockRejectedValue(mockError);

      await expect(plug.getDeviceInfo()).rejects.toThrow('API Error');
    });

    test('should handle energy monitoring API errors', async () => {
      // Mock device that should support energy monitoring
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
      
      const mockError = new Error('Energy API Error');
      jest.spyOn(plug as any, 'sendRequest').mockRejectedValue(mockError);

      await expect(plug.getUsageInfo()).rejects.toThrow(DeviceCapabilityError);
    });

    test('should return default values for energy API errors when not throwing', async () => {
      // Mock device that should support energy monitoring
      jest.spyOn(plug, 'hasEnergyMonitoring').mockResolvedValue(true);
      
      const mockError = new Error('Energy API Error');
      jest.spyOn(plug as any, 'sendRequest').mockRejectedValue(mockError);

      const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
      expect(usageInfo).toEqual({
        todayRuntime: 0,
        monthRuntime: 0,
        todayEnergy: 0,
        monthEnergy: 0,
        currentPower: 0
      });
    });
  });
});