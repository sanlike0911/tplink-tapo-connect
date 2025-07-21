/**
 * Simple Integrated Retry Example
 * 
 * This example demonstrates the new integrated retry functionality where:
 * - Retry logic is built into the wrapper methods
 * - Users just pass optional retry parameters
 * - No manual retry handling required
 */

import { tplinkTapoConnectWrapper, type RetryOptions } from '../src/index';
import { config } from 'dotenv';

config();

async function main(): Promise<void> {
  const wrapper = tplinkTapoConnectWrapper.getInstance();
  
  const email = process.env['TAPO_USERNAME'] || 'your-tapo-username';
  const password = process.env['TAPO_PASSWORD'] || 'your-tapo-password';
  const plugIp = process.env['PLUG_IP'] || '192.168.0.78';

  console.log('=== Simple Integrated Retry Example ===\\n');

  // ============================================================================
  // Example 1: Default behavior (retry enabled by default)
  // ============================================================================
  console.log('📋 Example 1: Default behavior (automatic retry)');
  
  try {
    // No retry options = use intelligent defaults
    const deviceInfo = await wrapper.getTapoDeviceInfo(email, password, plugIp);
    
    if (deviceInfo.result) {
      console.log('✅ Device info retrieved successfully');
      console.log(`   Model: ${deviceInfo.tapoDeviceInfo?.model}`);
      console.log(`   Status: ${deviceInfo.tapoDeviceInfo?.deviceOn ? 'ON' : 'OFF'}`);
    } else {
      console.log('❌ Failed to get device info');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\\n⏳ Waiting 2 seconds between operations...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // Example 2: Custom retry settings
  // ============================================================================
  console.log('\\n⚙️ Example 2: Custom retry settings');
  
  const customRetry: RetryOptions = {
    maxAttempts: 5,           // Try up to 5 times
    baseDelay: 1500,          // 1.5 second base delay
    strategy: 'linear'        // Linear backoff (1.5s, 3s, 4.5s, 6s)
  };

  try {
    const result = await wrapper.setTapoTurnOn(email, password, plugIp, 'auto', customRetry);
    
    if (result.result) {
      console.log('✅ Device turned on with custom retry settings');
    } else {
      console.log('❌ Failed to turn on device');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\\n⏳ Waiting 3 seconds between operations...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ============================================================================
  // Example 3: Disable retry for specific operation
  // ============================================================================
  console.log('\\n🚀 Example 3: Disable retry for fast operation');
  
  const noRetry: RetryOptions = {
    enabled: false  // Explicitly disable retry
  };

  try {
    const result = await wrapper.setTapoTurnOff(email, password, plugIp, 'auto', noRetry);
    
    if (result.result) {
      console.log('✅ Device turned off (no retry, fast operation)');
    } else {
      console.log('❌ Failed to turn off device (expected occasionally without retry)');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\\n⏳ Waiting 2 seconds between operations...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ============================================================================
  // Example 4: Energy monitoring with conservative retry
  // ============================================================================
  console.log('\\n📊 Example 4: Energy monitoring with conservative retry');
  
  const conservativeRetry: RetryOptions = {
    maxAttempts: 2,           // Only 2 attempts for energy monitoring
    baseDelay: 1000,          // 1 second delay
    strategy: 'fixed'         // Fixed delay (no escalation)
  };

  try {
    const energyResult = await wrapper.getTapoEnergyUsage(email, password, plugIp, 'P110', conservativeRetry);
    
    if (energyResult.result) {
      console.log('✅ Energy usage retrieved successfully');
    } else {
      console.log('ℹ️ Energy monitoring not available (expected for basic plugs)');
    }
  } catch (error) {
    console.log('ℹ️ Energy monitoring error (expected):', error);
  }

  console.log('\\n⏳ Waiting 1 second between operations...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // ============================================================================
  // Example 5: Final verification with minimal retry
  // ============================================================================
  console.log('\\n🔍 Example 5: Final verification');
  
  const quickRetry: RetryOptions = {
    maxAttempts: 2,
    baseDelay: 500,
    strategy: 'fixed'
  };

  try {
    const finalState = await wrapper.getTapoDeviceInfo(email, password, plugIp, 'P105', quickRetry);
    
    if (finalState.result) {
      console.log('✅ Final device state retrieved');
      console.log(`   Final Status: ${finalState.tapoDeviceInfo?.deviceOn ? 'ON' : 'OFF'}`);
      console.log(`   On Time: ${finalState.tapoDeviceInfo?.onTime} seconds`);
    }
  } catch (error) {
    console.log('❌ Error getting final state:', error);
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\\n✨ Summary of Integrated Retry Benefits:');
  console.log('   💪 Built-in retry logic - no manual handling required');
  console.log('   🎛️ Optional parameters - customize when needed');
  console.log('   🤖 Intelligent defaults - works great out of the box');
  console.log('   🚀 Performance options - disable retry for speed');
  console.log('   🔧 Flexible configuration - adapt to your use case');
  console.log('\\n🎉 All examples completed successfully!');
}

if (require.main === module) {
  main().catch(console.error);
}