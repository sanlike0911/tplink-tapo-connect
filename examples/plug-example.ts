/**
 * Unified Tapo Smart Plug Example
 * Demonstrates all plug models (P100, P105, P110, P115) in a single comprehensive example
 */

import * as dotenv from 'dotenv';
import { TapoConnect, TapoCredentials } from '../src';

// Load environment variables
dotenv.config();

// Common credentials
const USERNAME = process.env.TAPO_USERNAME || '';
const PASSWORD = process.env.TAPO_PASSWORD || '';

// Plug configuration for each model
interface PlugTestConfig {
  model: 'P100' | 'P105' | 'P110' | 'P115';
  ipEnvVar: string;
  defaultIp: string;
  expectsEnergyMonitoring: boolean;
  description: string;
}

const PLUG_CONFIGS: PlugTestConfig[] = [
  { 
    model: 'P100', 
    ipEnvVar: 'P100_PLUG_IP', 
    defaultIp: '192.168.1.100', 
    expectsEnergyMonitoring: false,
    description: 'Basic smart plug without energy monitoring'
  },
  { 
    model: 'P105', 
    ipEnvVar: 'P105_PLUG_IP', 
    defaultIp: '192.168.1.105', 
    expectsEnergyMonitoring: false,
    description: 'Basic smart plug without energy monitoring (updated P100)'
  },
  { 
    model: 'P110', 
    ipEnvVar: 'P110_PLUG_IP', 
    defaultIp: '192.168.1.110', 
    expectsEnergyMonitoring: true,
    description: 'Smart plug with energy monitoring capabilities'
  },
  { 
    model: 'P115', 
    ipEnvVar: 'P115_PLUG_IP', 
    defaultIp: '192.168.1.115', 
    expectsEnergyMonitoring: true,
    description: 'Smart plug with energy monitoring capabilities (updated P110)'
  }
];

/**
 * Factory function to create the appropriate plug instance
 */
function createPlugByModel(model: string, ip: string, credentials: TapoCredentials) {
  switch (model) {
    case 'P100':
      return TapoConnect.createP100Plug(ip, credentials);
    case 'P105':
      return TapoConnect.createP105Plug(ip, credentials);
    case 'P110':
      return TapoConnect.createP110Plug(ip, credentials);
    case 'P115':
      return TapoConnect.createP115Plug(ip, credentials);
    default:
      throw new Error(`Unsupported plug model: ${model}`);
  }
}

/**
 * Test basic plug operations (available on all models)
 */
async function testBasicOperations(plug: any, model: string): Promise<void> {
  console.log(`\n📱 Testing Basic Operations for ${model}:`);
  
  try {
    // Get device information
    console.log('  Getting device information...');
    const deviceInfo = await plug.getDeviceInfo();
    console.log(`  ✅ Device: ${deviceInfo.model} - ${deviceInfo.nickname || 'No nickname'}`);
    console.log(`  ✅ Status: ${deviceInfo.deviceOn ? 'ON' : 'OFF'}`);
    console.log(`  ✅ MAC: ${deviceInfo.mac}`);
    console.log(`  ✅ Firmware: ${deviceInfo.fwVer}`);
    
    // Check current status
    const isOn = await plug.isOn();
    console.log(`  ✅ Current status check: ${isOn ? 'ON' : 'OFF'}`);
    
    // Test power control operations
    console.log('  Testing power control...');
    
    if (isOn) {
      console.log('  🔄 Turning OFF...');
      await plug.turnOff();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('  🔄 Turning ON...');
      await plug.turnOn();
    } else {
      console.log('  🔄 Turning ON...');
      await plug.turnOn();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('  🔄 Turning OFF...');
      await plug.turnOff();
    }
    
    // Test toggle operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('  🔄 Testing toggle...');
    await plug.toggle();
    
    console.log(`  ✅ ${model} basic operations completed successfully`);
    
  } catch (error) {
    console.error(`  ❌ Error during basic operations for ${model}:`, error.message);
  }
}

/**
 * Test energy monitoring features (available on P110/P115 only)
 */
async function testEnergyMonitoring(plug: any, model: string, expectsEnergyMonitoring: boolean): Promise<void> {
  console.log(`\n⚡ Testing Energy Monitoring for ${model}:`);
  
  // First check if energy monitoring is supported
  const hasEnergySupport = await plug.hasEnergyMonitoring();
  console.log(`  📊 Energy monitoring support: ${hasEnergySupport ? 'YES' : 'NO'}`);
  
  if (hasEnergySupport !== expectsEnergyMonitoring) {
    console.warn(`  ⚠️  Unexpected energy monitoring support! Expected: ${expectsEnergyMonitoring}, Got: ${hasEnergySupport}`);
  }
  
  if (!hasEnergySupport) {
    console.log(`  ✅ ${model} correctly reports no energy monitoring support`);
    
    // Demonstrate error handling approaches for non-supporting devices
    console.log('  🔍 Testing error handling approaches:');
    
    // Approach 1: Using options parameter
    try {
      console.log('    Approach 1: Using throwOnUnsupported: false');
      const usage = await plug.getUsageInfo({ throwOnUnsupported: false });
      console.log('    ✅ Graceful handling with options:', usage);
    } catch (error) {
      console.log('    ❌ Options approach failed:', error.message);
    }
    
    // Approach 2: Using result pattern (if available)
    try {
      console.log('    Approach 2: Using result pattern');
      if (typeof plug.getUsageInfoResult === 'function') {
        const result = await plug.getUsageInfoResult();
        console.log('    ✅ Result pattern:', result.success ? 'Success' : `Failed: ${result.error}`);
      } else {
        console.log('    ℹ️  Result pattern not available on this device class');
      }
    } catch (error) {
      console.log('    ❌ Result pattern failed:', error.message);
    }
    
    // Approach 3: Traditional try-catch
    try {
      console.log('    Approach 3: Traditional try-catch');
      await plug.getCurrentPower();
      console.log('    ⚠️  Unexpected success - energy monitoring should not be available');
    } catch (error) {
      console.log('    ✅ Expected error caught:', error.message.substring(0, 60) + '...');
    }
    
    return;
  }
  
  // Test energy monitoring features for supporting devices
  console.log('  🔋 Testing energy monitoring capabilities:');
  
  try {
    // Current power consumption
    const currentPower = await plug.getCurrentPower();
    console.log(`  ✅ Current Power: ${currentPower.toFixed(2)}W`);
    
    // Today's energy consumption  
    if (typeof plug.getTodayEnergy === 'function') {
      const todayEnergy = await plug.getTodayEnergy();
      console.log(`  ✅ Today's Energy: ${todayEnergy.toFixed(3)}kWh`);
    }
    
    // Complete energy usage information
    const energyUsage = await plug.getEnergyUsage();
    console.log('  ✅ Energy Usage Details:');
    console.log(`    - Today Runtime: ${Math.floor(energyUsage.todayRuntime / 60)} minutes`);
    console.log(`    - Month Runtime: ${Math.floor(energyUsage.monthRuntime / 60)} minutes`);
    console.log(`    - Today Energy: ${energyUsage.todayEnergy.toFixed(3)}kWh`);
    console.log(`    - Month Energy: ${energyUsage.monthEnergy.toFixed(3)}kWh`);
    
    // Additional energy data (if available)
    if (typeof plug.getEnergyData === 'function') {
      const energyData = await plug.getEnergyData();
      console.log('  ✅ Extended Energy Data:', energyData);
    }
    
    console.log(`  ✅ ${model} energy monitoring completed successfully`);
    
  } catch (error) {
    console.error(`  ❌ Error during energy monitoring for ${model}:`, error.message);
  }
}

/**
 * Test advanced features (usage tracking, health status, etc.)
 */
async function testAdvancedFeatures(plug: any, model: string): Promise<void> {
  console.log(`\n🔧 Testing Advanced Features for ${model}:`);
  
  try {
    // On-time tracking
    console.log('  📅 Testing on-time tracking...');
    const onTime = await plug.getOnTime();
    console.log(`  ✅ Device on-time: ${Math.floor(onTime / 60)} minutes (${onTime} seconds)`);
    
    // Usage information
    console.log('  📊 Getting usage information...');
    const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
    if (usageInfo.onTime !== undefined) {
      console.log(`  ✅ Usage on-time: ${Math.floor(usageInfo.onTime / 60)} minutes`);
    }
    
    // Device health status
    const deviceInfo = await plug.getDeviceInfo();
    if (deviceInfo.overheated !== undefined) {
      console.log(`  🌡️  Overheated status: ${deviceInfo.overheated ? 'YES - WARNING!' : 'NO'}`);
    }
    
    // Connection information
    if (typeof plug.getConnectionInfo === 'function') {
      const connectionInfo = plug.getConnectionInfo();
      console.log(`  🔗 Connection Protocol: ${connectionInfo.protocol}`);
      console.log(`  🔗 Connection Status: ${connectionInfo.connected ? 'Connected' : 'Disconnected'}`);
    }
    
    console.log(`  ✅ ${model} advanced features completed`);
    
  } catch (error) {
    console.error(`  ❌ Error during advanced features test for ${model}:`, error.message);
  }
}

/**
 * Test error handling patterns
 */
async function testErrorHandlingPatterns(plug: any, model: string): Promise<void> {
  console.log(`\n🛡️  Testing Error Handling Patterns for ${model}:`);
  
  try {
    // Test with enhanced result methods (if available)
    if (typeof plug.turnOnWithResult === 'function') {
      console.log('  🔄 Testing enhanced result pattern...');
      const result = await plug.turnOnWithResult();
      console.log(`  ✅ Enhanced result: ${result.success ? 'Success' : 'Failed'}`);
      if (result.metadata) {
        console.log(`  ⏱️  Operation took: ${result.metadata.duration}ms`);
        console.log(`  🔗 Protocol used: ${result.metadata.protocol}`);
      }
    }
    
    // Test health check (if available)
    if (typeof plug.healthCheck === 'function') {
      console.log('  🏥 Testing health check...');
      const health = await plug.healthCheck();
      console.log(`  ✅ Health Status:`);
      console.log(`    - Connected: ${health.connected}`);
      console.log(`    - Responsive: ${health.responsive}`);
      console.log(`    - Protocol: ${health.protocol}`);
      if (health.model) {
        console.log(`    - Model: ${health.model}`);
      }
      if (health.lastError) {
        console.log(`    - Last Error: ${health.lastError}`);
      }
    }
    
    console.log(`  ✅ ${model} error handling patterns completed`);
    
  } catch (error) {
    console.error(`  ❌ Error during error handling test for ${model}:`, error.message);
  }
}

/**
 * Test a single plug with comprehensive feature testing
 */
async function testSinglePlug(config: PlugTestConfig): Promise<boolean> {
  const ip = process.env[config.ipEnvVar] || config.defaultIp;
  const credentials: TapoCredentials = { username: USERNAME, password: PASSWORD };
  
  console.log(`\n🔌 Testing ${config.model} Plug:`);
  console.log(`📍 IP: ${ip}`);
  console.log(`📝 Description: ${config.description}`);
  console.log(`⚡ Energy Monitoring Expected: ${config.expectsEnergyMonitoring ? 'YES' : 'NO'}`);
  
  let plug;
  
  try {
    // Create and connect to plug
    console.log(`\n🔗 Connecting to ${config.model} at ${ip}...`);
    plug = createPlugByModel(config.model, ip, credentials);
    await plug.connect();
    console.log(`✅ Successfully connected to ${config.model}`);
    
    // Run all test suites
    await testBasicOperations(plug, config.model);
    await testEnergyMonitoring(plug, config.model, config.expectsEnergyMonitoring);
    await testAdvancedFeatures(plug, config.model);
    await testErrorHandlingPatterns(plug, config.model);
    
    console.log(`\n🎉 All tests completed successfully for ${config.model}!`);
    return true;
    
  } catch (error) {
    console.error(`\n❌ Failed to test ${config.model}:`, error.message);
    return false;
  } finally {
    // Always disconnect
    if (plug) {
      try {
        await plug.disconnect();
        console.log(`🔌 Disconnected from ${config.model}`);
      } catch (error) {
        console.log(`⚠️  Warning: Could not disconnect from ${config.model}:`, error.message);
      }
    }
  }
}

/**
 * Test all available plugs
 */
async function testAllPlugs(): Promise<void> {
  console.log('🌟 Starting Unified Tapo Plug Testing Suite');
  console.log('=' .repeat(60));
  
  const results: Array<{ model: string; success: boolean }> = [];
  
  for (const config of PLUG_CONFIGS) {
    const success = await testSinglePlug(config);
    results.push({ model: config.model, success });
    
    // Add separator between tests
    if (config !== PLUG_CONFIGS[PLUG_CONFIGS.length - 1]) {
      console.log('\n' + '-'.repeat(60));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY:');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`  ${result.model}: ${status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📈 Overall Result: ${successCount}/${totalCount} tests passed`);
  
  if (successCount === totalCount) {
    console.log('🎉 All plug tests completed successfully!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

/**
 * Test specific plug models based on environment variable
 */
async function testSpecificPlugs(): Promise<void> {
  const testModels = process.env.TEST_PLUG_MODELS;
  
  if (!testModels) {
    await testAllPlugs();
    return;
  }
  
  const modelsToTest = testModels.split(',').map(m => m.trim().toUpperCase());
  const validConfigs = PLUG_CONFIGS.filter(config => 
    modelsToTest.includes(config.model)
  );
  
  if (validConfigs.length === 0) {
    console.error(`❌ No valid plug models found. Available models: ${PLUG_CONFIGS.map(c => c.model).join(', ')}`);
    return;
  }
  
  console.log(`🎯 Testing specific plug models: ${validConfigs.map(c => c.model).join(', ')}`);
  
  for (const config of validConfigs) {
    await testSinglePlug(config);
    if (config !== validConfigs[validConfigs.length - 1]) {
      console.log('\n' + '-'.repeat(60));
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Check credentials
  if (!USERNAME || !PASSWORD) {
    console.error('❌ Error: Please set TAPO_USERNAME and TAPO_PASSWORD environment variables');
    console.log('\nExample:');
    console.log('export TAPO_USERNAME="your_tapo_username"');
    console.log('export TAPO_PASSWORD="your_tapo_password"');
    console.log('\nOptional device-specific IP addresses:');
    PLUG_CONFIGS.forEach(config => {
      console.log(`export ${config.ipEnvVar}="${config.defaultIp}"`);
    });
    console.log('\nOptional model selection:');
    console.log('export TEST_PLUG_MODELS="P100,P110"  # Test only specific models');
    process.exit(1);
  }
  
  console.log('🚀 Unified Tapo Plug Example');
  console.log(`👤 Username: ${USERNAME}`);
  console.log(`🔑 Password: ${'*'.repeat(PASSWORD.length)}`);
  
  try {
    await testSpecificPlugs();
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Command line argument handling
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('🔌 Unified Tapo Plug Example');
  console.log('\nUsage:');
  console.log('  npm run example:plug');
  console.log('  npm run example:plug -- --help');
  console.log('\nEnvironment Variables:');
  console.log('  TAPO_USERNAME     - Your Tapo account username (required)');
  console.log('  TAPO_PASSWORD     - Your Tapo account password (required)');
  console.log('  TEST_PLUG_MODELS  - Comma-separated models to test (optional)');
  console.log('                      Example: "P100,P110"');
  console.log('\n  Device IP addresses (optional):');
  PLUG_CONFIGS.forEach(config => {
    console.log(`    ${config.ipEnvVar.padEnd(15)} - ${config.model} IP address (default: ${config.defaultIp})`);
  });
  console.log('\nSupported Models:', PLUG_CONFIGS.map(c => c.model).join(', '));
  process.exit(0);
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}