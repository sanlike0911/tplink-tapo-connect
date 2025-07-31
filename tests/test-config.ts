export const TEST_CONFIG = {
  // 実デバイステスト用（CI/CDでは無効化）
  REAL_DEVICE_TESTS: process.env['ENABLE_REAL_DEVICE_TESTS'] === 'true',
  
  // テスト用デバイス情報
  TEST_DEVICES: {
    P100: { ip: '192.168.1.100', alias: 'test-plug-p100' },
    P105: { ip: '192.168.1.101', alias: 'test-plug-p105' },
    P110: { ip: '192.168.1.102', alias: 'test-plug-p110' },
    L510: { ip: '192.168.1.103', alias: 'test-bulb-l510' },
    L530: { ip: '192.168.1.104', alias: 'test-bulb-l530' }
  },
  
  // タイムアウト設定
  TIMEOUTS: {
    UNIT: 5000,
    INTEGRATION: 15000,
    E2E: 30000
  },
  
  // テスト用認証情報
  TEST_CREDENTIALS: {
    username: process.env['TAPO_TEST_USERNAME'] || 'test-user@example.com',
    password: process.env['TAPO_TEST_PASSWORD'] || 'test-password'
  },
  
  // モック設定
  MOCK_CONFIG: {
    ENABLE_NETWORK_DELAYS: process.env['MOCK_NETWORK_DELAYS'] === 'true',
    DEFAULT_DELAY: 100,
    ERROR_RATE: 0 // 0-1の範囲でエラー発生率を設定
  }
};

export const TEST_TIMEOUTS = TEST_CONFIG.TIMEOUTS;
export const TEST_DEVICES = TEST_CONFIG.TEST_DEVICES;
export const TEST_CREDENTIALS = TEST_CONFIG.TEST_CREDENTIALS;