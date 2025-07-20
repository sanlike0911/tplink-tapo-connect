import { TapoConnect, TapoCredentials } from '../src/index';
import { config } from 'dotenv';

config();

async function main(): Promise<void> {
  try {

    const credentials: TapoCredentials = {
      username: process.env['TAPO_USERNAME'] || 'your-tapo-username',
      password: process.env['TAPO_PASSWORD'] || 'your-tapo-password'
    };

    const plugIp = process.env['PLUG_IP'] || '192.168.0.78';
    console.log('Debug: Using plug IP:', plugIp);

    console.log('Creating P105 plug connection...');
    const plug = TapoConnect.createP105Plug(plugIp, credentials);

    console.log('Connecting to plug...');
    console.log('Debug: About to call plug.connect()');
    await plug.connect();
    console.log('Debug: Successfully connected to plug');

    console.log('Getting device info...');
    const deviceInfo = await plug.getDeviceInfo();
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));

    console.log('Getting current power status...');
    const isOn = await plug.isOn();
    console.log('Plug is currently:', isOn ? 'ON' : 'OFF');

    console.log('Checking energy monitoring support...');
    const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
    console.log('Energy monitoring supported:', hasEnergyMonitoring);

    console.log('Getting usage information...');

    // Method 1: Using options parameter (recommended)
    console.log('--- Using options parameter ---');
    const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
    console.log('Usage Info:', JSON.stringify(usageInfo, null, 2));

    const currentPower = await plug.getCurrentPower({ throwOnUnsupported: false });
    console.log('Current Power:', currentPower, 'W');

    const todayEnergy = await plug.getTodayEnergy({ throwOnUnsupported: false });
    console.log('Today Energy:', todayEnergy, 'Wh');

    // Method 2: Using Result pattern for explicit error handling
    console.log('--- Using Result pattern ---');
    const usageResult = await plug.getUsageInfoResult();
    if (usageResult.success) {
      console.log('Usage Info (Result):', JSON.stringify(usageResult.data, null, 2));
    } else {
      console.log('Usage Info not available:', usageResult.error.message);
    }

    // Method 3: Traditional try-catch (when you want to handle errors explicitly)
    if (hasEnergyMonitoring) {
      console.log('--- Using traditional approach (device supports energy monitoring) ---');
      try {
        const traditionalUsage = await plug.getUsageInfo();
        console.log('Traditional Usage Info:', JSON.stringify(traditionalUsage, null, 2));
      } catch (error) {
        console.log('Energy monitoring error:', error);
      }
    }

    console.log('Getting on time...');
    const onTime = await plug.getOnTime();
    console.log('On time:', onTime, 'seconds');

    console.log('Checking overheated status...');
    const overheated = await plug.isOverheated();
    console.log('Overheated:', overheated);

    console.log('Testing toggle functionality...');
    console.log('Current state:', await plug.isOn() ? 'ON' : 'OFF');

    console.log('Toggling plug...');
    await plug.toggle();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('New state:', await plug.isOn() ? 'ON' : 'OFF');

    console.log('Toggling back...');
    await plug.toggle();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Final state:', await plug.isOn() ? 'ON' : 'OFF');

    await plug.disconnect();
    console.log('Example completed successfully');

  } catch (error) {
    console.error('Error in P105 example:', error);
    console.error('Debug: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}