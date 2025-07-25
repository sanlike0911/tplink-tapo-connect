import { tplinkTapoConnectWrapper } from '../src/wrapper/tplink-tapo-connect-wrapper';
import { config } from 'dotenv';

config();

async function main(): Promise<void> {
  try {
    const wrapper = tplinkTapoConnectWrapper.getInstance();

    const email = process.env['TAPO_USERNAME'] || 'your-tapo-username';
    const password = process.env['TAPO_PASSWORD'] || 'your-tapo-password';
    const ipAddress = process.env['TAPO_IPADDRESS'] || '192.168.0.10';

    console.log('=== TP-Link Tapo Connect Wrapper Example ===');
    console.log('Email:', email);
    console.log('Plug IP:', ipAddress);

    // Test device list(should fail with current implementation)
    console.log('\n--- Testing Device List (cloud API not implemented) ---');
    try {
      const deviceList = await wrapper.getTapoDevicesList(email, password);
      console.log('Device list:', deviceList);
    } catch (error) {
      console.log('Device list error (expected):', error);
    }

    // Test device info retrieval
    console.log('\n--- Getting Device Info ---');
    console.log('Note: getTapoDeviceInfo() only retrieves basic device information');
    try {
      const deviceInfoResult = await wrapper.getTapoDeviceInfo(email, password, ipAddress);
      if (deviceInfoResult.result) {
        console.log('Device Info Retrieved Successfully:');
        console.log('- Model:', deviceInfoResult.tapoDeviceInfo?.model);
        console.log('- Type:', deviceInfoResult.tapoDeviceInfo?.type);
        console.log('- Avatar:', deviceInfoResult.tapoDeviceInfo?.avatar);
        console.log('- Device On:', deviceInfoResult.tapoDeviceInfo?.device_on);
        console.log('- On Time:', deviceInfoResult.tapoDeviceInfo?.on_time, 'seconds');
      } else {
        console.log('Failed to get device info:', deviceInfoResult.errorInf?.message);
      }
    } catch (error) {
      console.log('Device info error:', error);
    }

    // Test rapid on/off operations like Python tapo example (tapo_p110.py)
    for (let i = 0; i < 0; i++) {
      console.log('\n--- Testing Rapid On/Off Operations (Python-style) ---');
      console.log('Turning device on...');
      await wrapper.setTapoTurnOn(email, password, ipAddress);
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Turning device off...');
      await wrapper.setTapoTurnOff(email, password, ipAddress);
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test energy usage with device detection and validation
    console.log('\n--- Testing Energy Usage ---');
    const energyResult = await wrapper.getTapoEnergyUsage(email, password, ipAddress);
    if (energyResult.result) {
      console.log('✅ Energy usage retrieved successfully');
      console.log('   Device Model:', energyResult.tapoDeviceInfo?.model);
      console.log('   Device Type:', energyResult.tapoDeviceInfo?.type);
      console.log('   Energy data available in tapoEnergyUsage field');
    } else {
      console.log('ℹ️ Energy usage not available (expected for basic plugs):', energyResult.errorInf?.message);
    }

    // Test brightness control (should fail for plugs)
    console.log('\n--- Testing Brightness Control (should fail for plugs) ---');
    try {
      const brightnessResult = await wrapper.setTapoBrightness(email, password, ipAddress, 50);
      if (brightnessResult.result) {
        console.log('Brightness set successfully (unexpected for plugs)');
      } else {
        console.log('Brightness control failed (expected for plugs):', brightnessResult.errorInf?.message);
      }
    } catch (error) {
      console.log('Brightness control error (expected):', error);
    }

    console.log('\n=== Wrapper Example Completed ===');

  } catch (error) {
    console.error('Error in wrapper example:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}