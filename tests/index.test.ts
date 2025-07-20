import { TapoConnect, P105Plug, TapoCredentials } from '../src';

describe('TapoConnect', () => {
  const mockCredentials: TapoCredentials = {
    username: 'test-user',
    password: 'test-password'
  };

  describe('Factory methods', () => {
    test('should create P105 plug instance', () => {
      const plug = TapoConnect.createP105Plug('192.168.1.100', mockCredentials);
      expect(plug).toBeInstanceOf(P105Plug);
    });
  });
});

describe('P105Plug', () => {
  const mockCredentials: TapoCredentials = {
    username: 'test-user',
    password: 'test-password'
  };

  let plug: P105Plug;

  beforeEach(() => {
    plug = new P105Plug('192.168.1.100', mockCredentials);
  });

  test('should initialize correctly', () => {
    expect(plug).toBeInstanceOf(P105Plug);
  });

  test('should have required control methods', () => {
    expect(typeof plug.connect).toBe('function');
    expect(typeof plug.disconnect).toBe('function');
    expect(typeof plug.getDeviceInfo).toBe('function');
    expect(typeof plug.turnOn).toBe('function');
    expect(typeof plug.turnOff).toBe('function');
    expect(typeof plug.toggle).toBe('function');
    expect(typeof plug.isOn).toBe('function');
  });

  test('should have energy monitoring methods', () => {
    expect(typeof plug.getUsageInfo).toBe('function');
    expect(typeof plug.getCurrentPower).toBe('function');
    expect(typeof plug.getTodayEnergy).toBe('function');
    expect(typeof plug.getMonthEnergy).toBe('function');
    expect(typeof plug.getTodayRuntime).toBe('function');
    expect(typeof plug.getMonthRuntime).toBe('function');
  });

  test('should have status check methods', () => {
    expect(typeof plug.isOverheated).toBe('function');
    expect(typeof plug.getOnTime).toBe('function');
    expect(typeof plug.setDeviceInfo).toBe('function');
  });
});