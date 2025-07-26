const { tplinkTapoConnectWrapper } = require('./dist/src/wrapper/tplink-tapo-connect-wrapper');
const { config } = require('dotenv');

config();

async function testBrightness() {
  try {
    const wrapper = tplinkTapoConnectWrapper.getInstance();
    
    const email = process.env.TAPO_USERNAME || 'your-email';
    const password = process.env.TAPO_PASSWORD || 'your-password';
    const ipAddress = process.env.TAPO_IPADDRESS || '192.168.0.10';
    
    console.log('Testing brightness control...');
    console.log(`Device IP: ${ipAddress}`);
    
    const result = await wrapper.setTapoBrightness(email, password, ipAddress, 50);
    
    if (result.result) {
      console.log('✅ Brightness set successfully');
    } else {
      console.log('❌ Brightness control failed:');
      console.log('Error:', result.errorInf?.message);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testBrightness();