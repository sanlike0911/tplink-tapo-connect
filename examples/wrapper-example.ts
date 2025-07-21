import { tplinkTapoConnectWrapper, TapoDeviceType } from '../src/wrapper/tplink-tapo-connect-wrapper';
import { config } from 'dotenv';

config();

async function main(): Promise<void> {
  try {
    const wrapper = tplinkTapoConnectWrapper.getInstance();

    const email = process.env['TAPO_USERNAME'] || 'your-tapo-username';
    const password = process.env['TAPO_PASSWORD'] || 'your-tapo-password';
    const plugIp = process.env['PLUG_IP'] || '192.168.0.78';

    console.log('=== TP-Link Tapo Connect Wrapper Example ===');
    console.log('Email:', email);
    console.log('Plug IP:', plugIp);

    // Test device info retrieval with auto-detection
    console.log('\n--- Getting Device Info (Auto Detection) ---');
    try {
      const deviceInfoResult = await wrapper.getTapoDeviceInfo(email, password, plugIp, 'auto');
      if (deviceInfoResult.result) {
        console.log('Device Info Retrieved Successfully:');
        console.log('- Model:', deviceInfoResult.tapoDeviceInfo?.model);
        console.log('- Device On:', deviceInfoResult.tapoDeviceInfo?.deviceOn);
        console.log('- On Time:', deviceInfoResult.tapoDeviceInfo?.onTime, 'seconds');
      } else {
        console.log('Failed to get device info:', deviceInfoResult.errorInf?.message);
      }
    } catch (error) {
      console.log('Device info error:', error);
    }

    // Test device info retrieval with explicit P105 specification
    console.log('\n--- Getting Device Info (Explicit P105) ---');
    try {
      const deviceInfoResult = await wrapper.getTapoDeviceInfo(email, password, plugIp, 'P105');
      if (deviceInfoResult.result) {
        console.log('P105 Device Info Retrieved Successfully:');
        console.log('- Model:', deviceInfoResult.tapoDeviceInfo?.model);
        console.log('- Device On:', deviceInfoResult.tapoDeviceInfo?.deviceOn);
      } else {
        console.log('Failed to get P105 device info:', deviceInfoResult.errorInf?.message);
      }
    } catch (error) {
      console.log('P105 device info error:', error);
    }

    // Test turn on with auto-detection
    console.log('\n--- Testing Turn On (Auto Detection) ---');
    try {
      const turnOnResult = await wrapper.setTapoTurnOn(email, password, plugIp, 'auto');
      if (turnOnResult.result) {
        console.log('Successfully turned on device with auto-detection');
      } else {
        console.log('Failed to turn on device:', turnOnResult.errorInf?.message);
      }
    } catch (error) {
      console.log('Turn on error:', error);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test turn off with explicit P115 device type
    console.log('\n--- Testing Turn Off (Explicit P115) ---');
    try {
      const turnOffResult = await wrapper.setTapoTurnOff(email, password, plugIp, 'auto');
      if (turnOffResult.result) {
        console.log('Successfully turned off P115 device');
      } else {
        console.log('Failed to turn off P115 device:', turnOffResult.errorInf?.message);
      }
    } catch (error) {
      console.log('P115 turn off error:', error);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test turn on with explicit P100 device type
    console.log('\n--- Testing Turn On (Explicit P100) ---');
    try {
      const turnOnResult = await wrapper.setTapoTurnOn(email, password, plugIp, 'P100');
      if (turnOnResult.result) {
        console.log('Successfully turned on P100 device');
      } else {
        console.log('Failed to turn on P100 device:', turnOnResult.errorInf?.message);
      }
    } catch (error) {
      console.log('P100 turn on error:', error);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test turn off with explicit P115 device type
    console.log('\n--- Testing Turn Off (Explicit P115) ---');
    try {
      const turnOffResult = await wrapper.setTapoTurnOff(email, password, plugIp, 'P115');
      if (turnOffResult.result) {
        console.log('Successfully turned off P115 device');
      } else {
        console.log('Failed to turn off P115 device:', turnOffResult.errorInf?.message);
      }
    } catch (error) {
      console.log('P115 turn off error:', error);
    }

    // Test energy usage with explicit P110 device type
    console.log('\n--- Testing Energy Usage (Explicit P110) ---');
    try {
      const energyResult = await wrapper.getTapoEnergyUsage(email, password, plugIp, 'P110');
      if (energyResult.result) {
        console.log('P110 Energy usage retrieved:', energyResult.tapoDeviceInfo);
      } else {
        console.log('P110 Energy usage not available (may need actual P110 device):', energyResult.errorInf?.message);
      }
    } catch (error) {
      console.log('P110 Energy usage error:', error);
    }

    // Test turn on with explicit P105 device type
    console.log('\n--- Testing Turn On (Explicit P105) ---');
    try {
      const turnOnResult = await wrapper.setTapoTurnOn(email, password, plugIp, 'P105');
      if (turnOnResult.result) {
        console.log('Successfully turned on P105 device');
      } else {
        console.log('Failed to turn on P105 device:', turnOnResult.errorInf?.message);
      }
    } catch (error) {
      console.log('P105 turn on error:', error);
    }

    // Test energy usage with auto-detection (should gracefully handle device capabilities)
    console.log('\n--- Testing Energy Usage (Auto Detection) ---');
    try {
      const energyResult = await wrapper.getTapoEnergyUsage(email, password, plugIp, 'auto');
      if (energyResult.result) {
        console.log('Auto-detected energy usage retrieved:', energyResult.tapoDeviceInfo);
      } else {
        console.log('Energy usage not available (expected for basic plugs):', energyResult.errorInf?.message);
      }
    } catch (error) {
      console.log('Auto-detected energy usage error:', error);
    }

    // Test brightness control (should fail for plugs)
    console.log('\n--- Testing Brightness Control (should fail for plugs) ---');
    try {
      const brightnessResult = await wrapper.setTapoBrightness(email, password, plugIp, 50);
      if (brightnessResult.result) {
        console.log('Brightness set successfully (unexpected for plugs)');
      } else {
        console.log('Brightness control failed (expected for plugs):', brightnessResult.errorInf?.message);
      }
    } catch (error) {
      console.log('Brightness control error (expected):', error);
    }

    // Test device list (should fail with current implementation)
    console.log('\n--- Testing Device List (cloud API not implemented) ---');
    try {
      const deviceList = await wrapper.getTapoDevicesList(email, password);
      console.log('Device list:', deviceList);
    } catch (error) {
      console.log('Device list error (expected):', error);
    }

    // Demonstrate device type testing for all supported models
    console.log('\n--- Testing All Device Types ---');
    const deviceTypes: TapoDeviceType[] = ['P100', 'P105', 'P110', 'P115'];

    for (const deviceType of deviceTypes) {
      console.log(`\n  Testing ${deviceType} Device Type:`);
      try {
        const deviceInfoResult = await wrapper.getTapoDeviceInfo(email, password, plugIp, deviceType);
        if (deviceInfoResult.result) {
          console.log(`  ✅ ${deviceType} - Device info retrieved successfully`);
          console.log(`     Model: ${deviceInfoResult.tapoDeviceInfo?.model}`);
          console.log(`     Status: ${deviceInfoResult.tapoDeviceInfo?.deviceOn ? 'ON' : 'OFF'}`);
        } else {
          console.log(`  ❌ ${deviceType} - Failed: ${deviceInfoResult.errorInf?.message}`);
        }
      } catch (error) {
        console.log(`  ❌ ${deviceType} - Error: ${error}`);
      }

      // Small delay between device type tests
      await new Promise(resolve => setTimeout(resolve, 1000));
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