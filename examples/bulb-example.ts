/**
 * Example demonstrating Tapo Smart Bulb control (L510, L520, L530)
 */

import * as dotenv from 'dotenv';
import { TapoConnect } from '../src';

// Load environment variables
dotenv.config();

const DEVICE_IP = process.env.DEVICE_IP || '192.168.1.100';
const USERNAME = process.env.TAPO_USERNAME || '';
const PASSWORD = process.env.TAPO_PASSWORD || '';

async function demonstrateBulbControl() {
  console.log('=== Tapo Smart Bulb Example ===\n');

  if (!USERNAME || !PASSWORD) {
    console.error('Please set TAPO_USERNAME and TAPO_PASSWORD environment variables');
    process.exit(1);
  }

  try {
    // Example 1: L510 Bulb (Dimmable white)
    console.log('1. L510 Bulb (Dimmable White) Example:');
    const l510 = TapoConnect.createL510Bulb(DEVICE_IP, {
      username: USERNAME,
      password: PASSWORD
    });

    await l510.connect();
    console.log('Connected to L510 bulb');

    // Get device info
    const l510Info = await l510.getDeviceInfo();
    console.log(`Device: ${l510Info.model} - ${l510Info.nickname}`);
    console.log(`Current brightness: ${l510Info.brightness}%`);

    // Control brightness
    console.log('Setting brightness to 75%...');
    await l510.setBrightness(75);
    
    console.log('Turning on...');
    await l510.turnOn();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Turning off...');
    await l510.turnOff();
    
    await l510.disconnect();
    console.log('L510 example completed\n');

    // Example 2: L520 Bulb (Tunable white)
    console.log('2. L520 Bulb (Tunable White) Example:');
    const l520 = TapoConnect.createL520Bulb(DEVICE_IP, {
      username: USERNAME,
      password: PASSWORD
    });

    await l520.connect();
    console.log('Connected to L520 bulb');

    // Check capabilities
    console.log('L520 Capabilities:');
    console.log(`- Brightness: ${l520.supportsFeature('brightness')}`);
    console.log(`- Color Temperature: ${l520.supportsFeature('colorTemperature')}`);
    console.log(`- Full Color: ${l520.supportsFeature('color')}`);

    if (await l520.hasColorTemperatureSupport()) {
      console.log('Setting warm white (3000K)...');
      await l520.setColorTemperature(3000, 80);
      await l520.turnOn();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Setting cool white (6000K)...');
      await l520.setColorTemperature(6000, 60);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await l520.turnOff();
    await l520.disconnect();
    console.log('L520 example completed\n');

    // Example 3: L530 Bulb (Full color with effects)
    console.log('3. L530 Bulb (Full Color with Effects) Example:');
    const l530 = TapoConnect.createL530Bulb(DEVICE_IP, {
      username: USERNAME,
      password: PASSWORD
    });

    await l530.connect();
    console.log('Connected to L530 bulb');

    // Check capabilities
    console.log('L530 Capabilities:');
    console.log(`- Brightness: ${l530.supportsFeature('brightness')}`);
    console.log(`- Color Temperature: ${l530.supportsFeature('colorTemperature')}`);
    console.log(`- Full Color: ${l530.supportsFeature('color')}`);
    console.log(`- Light Effects: ${l530.supportsFeature('effects')}`);

    if (await l530.hasColorSupport()) {
      console.log('Setting red color...');
      await l530.setNamedColor('red');
      await l530.turnOn();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Setting blue color using RGB...');
      await l530.setColorRGB({ red: 0, green: 0, blue: 255 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Setting custom HSV color (purple)...');
      await l530.setColor({ hue: 270, saturation: 100, value: 80 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (await l530.hasEffectsSupport()) {
      console.log('Starting rainbow effect...');
      await l530.setLightEffect({
        effect: 'rainbow',
        speed: 5,
        brightness: 90
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Turning off effects...');
      await l530.turnOffEffect();
    }
    
    await l530.turnOff();
    await l530.disconnect();
    console.log('L530 example completed\n');

    console.log('=== All bulb examples completed successfully! ===');

  } catch (error) {
    console.error('Error in bulb example:', error);
  }
}

// Run the example
if (require.main === module) {
  demonstrateBulbControl().catch(console.error);
}