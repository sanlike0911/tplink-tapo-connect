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

    console.log('Creating P100 plug connection...');
    const plug = TapoConnect.createP100Plug(plugIp, credentials);

    console.log('Connecting to plug...');
    await plug.connect();
    console.log('Successfully connected to P100 plug');

    console.log('Getting device info...');
    const deviceInfo = await plug.getDeviceInfo();
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));

    console.log('Getting current power status...');
    const isOn = await plug.isOn();
    console.log('Plug is currently:', isOn ? 'ON' : 'OFF');

    console.log('Checking energy monitoring support...');
    const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
    console.log('Energy monitoring supported:', hasEnergyMonitoring);

    console.log('Getting usage information (P100 does not support energy monitoring)...');
    const usageInfo = await plug.getUsageInfo({ throwOnUnsupported: false });
    console.log('Usage Info:', JSON.stringify(usageInfo, null, 2));

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
    console.log('P100 example completed successfully');

  } catch (error) {
    console.error('Error in P100 example:', error);
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