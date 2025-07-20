import { TapoConnect, TapoCredentials } from '../src/index';
import { config } from 'dotenv';

config();

async function main(): Promise<void> {
  try {

    const credentials: TapoCredentials = {
      username: process.env['TAPO_USERNAME'] || 'your-tapo-username',
      password: process.env['TAPO_PASSWORD'] || 'your-tapo-password'
    };

    const plugIp = process.env['P110_PLUG_IP'] || '192.168.0.79';
    console.log('Debug: Using P110 plug IP:', plugIp);

    console.log('Creating P110 plug connection...');
    const plug = TapoConnect.createP110Plug(plugIp, credentials);

    console.log('Connecting to plug...');
    await plug.connect();
    console.log('Successfully connected to P110 plug');

    console.log('Getting device info...');
    const deviceInfo = await plug.getDeviceInfo();
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));

    console.log('Getting current power status...');
    const isOn = await plug.isOn();
    console.log('Plug is currently:', isOn ? 'ON' : 'OFF');

    console.log('Checking energy monitoring support...');
    const hasEnergyMonitoring = await plug.hasEnergyMonitoring();
    console.log('Energy monitoring supported:', hasEnergyMonitoring);

    if (hasEnergyMonitoring) {
      console.log('Getting energy usage information...');
      
      try {
        const currentPower = await plug.getCurrentPower();
        console.log('Current Power:', currentPower, 'W');
      } catch (error) {
        console.log('Current power not available:', error);
      }

      try {
        const todayEnergy = await plug.getTodayEnergy();
        console.log('Today Energy:', todayEnergy, 'Wh');
      } catch (error) {
        console.log('Today energy not available:', error);
      }

      try {
        const energyUsage = await plug.getEnergyUsage();
        console.log('Energy Usage:', JSON.stringify(energyUsage, null, 2));
      } catch (error) {
        console.log('Energy usage not available:', error);
      }

      try {
        const energyData = await plug.getEnergyData();
        console.log('Energy Data:', JSON.stringify(energyData, null, 2));
      } catch (error) {
        console.log('Energy data not available:', error);
      }

      try {
        const usageInfo = await plug.getUsageInfo();
        console.log('Usage Info:', JSON.stringify(usageInfo, null, 2));
      } catch (error) {
        console.log('Usage info not available:', error);
      }

      // Using Result pattern for explicit error handling
      console.log('--- Using Result pattern ---');
      const usageResult = await plug.getUsageInfoResult();
      if (usageResult.success) {
        console.log('Usage Info (Result):', JSON.stringify(usageResult.data, null, 2));
      } else {
        console.log('Usage Info not available:', usageResult.error?.message);
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
    console.log('P110 example completed successfully');

  } catch (error) {
    console.error('Error in P110 example:', error);
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