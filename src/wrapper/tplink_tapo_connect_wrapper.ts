import { TapoConnect, TapoCredentials } from '../index';
import { TapoDeviceInfo as P105DeviceInfo } from '../types';
import find from 'local-devices';

/* Device list that supports energy usage */
const supportEnergyUsage = [
    "P110",
    "P115",
    "KP115",
    "KP125"
];

// Supported device types
export type TapoDeviceType = 'P100' | 'P105' | 'P110' | 'P115' | 'auto';

// Device factory to create appropriate device instances
class DeviceFactory {
    static createDevice(deviceType: TapoDeviceType, ip: string, credentials: TapoCredentials, methodHint?: string): any {
        let actualDeviceType = deviceType;
        
        // Auto-select device type based on method hint
        if (deviceType === 'auto' && methodHint) {
            actualDeviceType = this.getDeviceTypeForMethod(methodHint);
        } else if (deviceType === 'auto') {
            // Default to P105 for basic operations
            actualDeviceType = 'P105';
        }

        switch (actualDeviceType) {
            case 'P100':
                return TapoConnect.createP100Plug(ip, credentials);
            case 'P105':
                return TapoConnect.createP105Plug(ip, credentials);
            case 'P110':
                return TapoConnect.createP110Plug(ip, credentials);
            case 'P115':
                return TapoConnect.createP115Plug(ip, credentials);
            default:
                // Fallback to P105
                return TapoConnect.createP105Plug(ip, credentials);
        }
    }

    static getDeviceTypeForMethod(method: string): TapoDeviceType {
        // Energy monitoring methods require P110/P115
        if (method === 'getEnergyUsage' || method === 'getCurrentPower') {
            return 'P110';
        }
        // Brightness/color methods require bulb devices (future implementation)
        if (method === 'setBrightness' || method === 'setColor') {
            return 'P105'; // Placeholder - would be L530 in future
        }
        // Default to P105 for basic operations
        return 'P105';
    }
}

// Simple ApiClient replacement for cloud device list functionality
class ApiClient {
    private username: string;
    private password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    async getDeviceList(): Promise<TapoDevice[]> {
        // Note: This is a placeholder implementation
        // The original cloud API functionality would require reverse engineering
        // For now, return empty array - users should use device discovery instead
        throw new Error("Cloud device list API not implemented. Use device discovery instead.");
    }

    async p105(ip: string, deviceType: TapoDeviceType = 'P105'): Promise<any> {
        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };
        return DeviceFactory.createDevice(deviceType, ip, credentials);
    }

    async l530(ip: string, deviceType: TapoDeviceType = 'P105'): Promise<any> {
        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };
        // For now, use specified device type as fallback - L530 bulb support can be added later
        return DeviceFactory.createDevice(deviceType, ip, credentials);
    }

    async createDevice(ip: string, deviceType: TapoDeviceType, methodHint?: string): Promise<any> {
        const credentials: TapoCredentials = {
            username: this.username,
            password: this.password
        };
        return DeviceFactory.createDevice(deviceType, ip, credentials, methodHint);
    }
}

export namespace tplinkTapoConnectWrapperType {
    export type tapoConnectResults = {
        result: boolean;
        tapoDeviceInfo?: TapoDeviceInfo;
        tapoDevice?: TapoDevice[];
        tapoEnergyUsage?: TapoDeviceInfo | undefined;
        errorInf?: Error;
    }
}

export type TapoDevice = {
    deviceType: string;
    fwVer: string;
    appServerUrl: string;
    deviceRegion: string;
    deviceId: string;
    deviceName: string;
    deviceHwVer: string;
    alias: string;
    deviceMac: string;
    oemId: string;
    deviceModel: string;
    hwId: string;
    fwId: string;
    isSameRegion: boolean;
    status: number;

    ip?: string
}

// Type for the device control interface returned by TapoDevice factory
export type TapoDeviceControlInterface = {
    turnOn: (deviceId?: string) => Promise<void>;
    turnOff: (deviceId?: string) => Promise<void>;
    setBrightness: (brightnessLevel?: number) => Promise<void>;
    setColour: (colour?: string) => Promise<void>;
    setHSL: (hue: number, sat: number, lum: number) => Promise<void>;
    getDeviceInfo: () => Promise<TapoDeviceInfo>;
    getChildDevicesInfo: () => Promise<Array<TapoDeviceInfo>>;
    getEnergyUsage: () => Promise<any>;
    // Convenience methods following Python API pattern
    on: () => Promise<void>;
    off: () => Promise<void>;
    getCurrentPower?: () => Promise<any>;
    // Cleanup method for session management
    close?: () => Promise<void>;
}

export type TapoDeviceInfo = P105DeviceInfo;

export type TapoProtocol = {
    send: (request: any) => any
    close?: () => Promise<void>
}

export type TapoDeviceKey = {
    key: Buffer;
    iv: Buffer;
    deviceIp: string;
    sessionCookie: string;
    token?: string;
    sessionUUID?: string;  // Add session UUID for consistency
}

export type TapoVideoImage = {
    uri: string;
    length: number;
    uriExpiresAt: number;
}

export type TapoVideo = {
    uri: string;
    duration: number;
    m3u8: string;
    startTimestamp: number;
    uriExpiresAt: number;
}

export type TapoVideoPageItem = {
    uuid: string;
    video: TapoVideo[];
    image: TapoVideoImage[];
    createdTime: number;
    eventLocalTime: string;
}

export type TapoVideoList = {
    deviceId: string;
    total: number;
    page: number;
    pageSize: number;
    index: TapoVideoPageItem[];
}

/**
 *
 *
 * @export
 * @class tplinkTapoConnectWrapper
 */
export class tplinkTapoConnectWrapper {

    readonly currentWorkingDirectory: string = process.cwd();
    private static _instance: tplinkTapoConnectWrapper;

    /**
     *
     *
     * @static
     * @returns {tplinkTapoConnectWrapper}
     * @memberof tplinkTapoConnectWrapper
     */
    public static getInstance(): tplinkTapoConnectWrapper {
        if (!this._instance)
            this._instance = new tplinkTapoConnectWrapper();
        return this._instance;
    }

    /**
     *Creates an instance of tplinkTapoConnectWrapper.
    * @memberof tplinkTapoConnectWrapper
    */
    constructor() {
        // Initialization completed
    }


    /**
     *
     *
     * @private
     * @param {string} _macAddress
     * @returns {string}
     * @memberof tplinkTapoConnectWrapper
     */
    private replaceMacAddress(_macAddress: string): string {
        return _macAddress.replace(/[:-]/g, '').toUpperCase();
    }

    /**
     *
     *
     * @private
     * @param {object} obj
     * @returns {boolean}
     * @memberof tplinkTapoConnectWrapper
     */
    private isEmpty(obj: object): boolean {
        return !Object.keys(obj).length;
    }

    /**
     *
     *
     * @private
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns
     * @memberof tplinkTapoConnectWrapper
     */
    private async getDeviceIpFromAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string) {
        let _deviceIp: string = "";
        const _devices: TapoDevice[] | undefined = await this.getTapoDevicesList(_email, _password) || undefined;
        if (_devices !== undefined) {
            for (const _items of _devices) {
                if (_items.alias === _alias) {
                    const _discover = await find({ address: _rangeOfIp });
                    _deviceIp = _discover?.find((_device) =>
                        this.replaceMacAddress(_device.mac) === this.replaceMacAddress(_items.deviceMac))?.ip || "";
                    break;
                }
            }
        } else {
            throw new Error("Failed to get tapo device list.");
        }
        return _deviceIp;
    }

    /**
     * getDeviceIp
     *
     * @private
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns
     * @memberof tplinkTapoConnectWrapper
     */
    private async getDeviceIp(_email: string, _password: string, _alias: string, _rangeOfIp: string) {
        const _targetIp: string = await this.getDeviceIpFromAlias(_email, _password, _alias, _rangeOfIp) || "";
        if (_targetIp === "") {
            throw new Error("Failed to get tapo ip address.");
        }
        return _targetIp;
    }

    /**
     *
     *
     * @param {string} [_email=process.env.TAPO_USERNAME || ""]
     * @param {string} _password
     * @returns {(Promise< tapo.TapoDevice[] | undefined >)}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDevicesList(_email: string = process.env['TAPO_USERNAME'] || "", _password: string): Promise<TapoDevice[] | undefined> {
        try {
            const client = new ApiClient(_email, _password);
            const _devices = await client.getDeviceList();
            return _devices;
        } catch (error) {
            throw new Error("Failed to get tapo device list.");
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOnAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp) || ""
            if (_targetIp === "") {
                throw new Error("Failed to get tapo ip address.");
            }
            return await this.setTapoTurnOn(_email, _password, _targetIp);
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOffAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp);
            return await this.setTapoTurnOff(_email, _password, _targetIp);
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @param {number} _brightness
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoBrightnessAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string, _brightness: number): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp);
            return await this.setTapoBrightness(_email, _password, _targetIp, _brightness);
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     * 
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @param {string} _rangeOfIp
     * @param {string} _colour
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoColourAlias(_email: string, _password: string, _alias: string, _rangeOfIp: string, _colour: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            if (_colour === "") {
                throw "Incorrect colour value";
            }
            const _targetIp: string = await this.getDeviceIp(_email, _password, _alias, _rangeOfIp);
            await this.setTapoColour(_email, _password, _targetIp, _colour);
            return { result: true };
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _alias
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDeviceInfoAlias(_email: string, _password: string, _alias: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        try {
            const client = new ApiClient(_email, _password);
            const _devices = await client.getDeviceList();
            for (const _items of _devices) {
                if (_items.alias === _alias) {
                    if (!_items.ip) {
                        throw new Error("Device IP not found.");
                    }
                    return await this.getTapoDeviceInfo(_email, _password, _items.ip);
                }
            }
            throw new Error("Device with alias not found.");
        } catch (error: any) {
            return { result: false, errorInf: error };
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @param {TapoDeviceType} _deviceType - Device type identifier (P100, P105, P110, P115, auto)
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoDeviceInfo(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'auto'): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        let device = null;
        try {
            let _tapoConnectResults: tplinkTapoConnectWrapperType.tapoConnectResults = { result: false };

            // Use new ApiClient with proper session management
            const client = new ApiClient(_email, _password);
            device = await client.createDevice(_targetIp, _deviceType, 'getDeviceInfo');
            
            // Connect to device
            await device.connect();

            // get DeviceInfo
            const _tapoDeviceInfo: TapoDeviceInfo = await device.getDeviceInfo();
            if (this.isEmpty(_tapoDeviceInfo)) {
                throw new Error("tapo device info not found.");
            }
            _tapoConnectResults.tapoDeviceInfo = _tapoDeviceInfo;

            // get EnergyUsage
            if (supportEnergyUsage.includes(_tapoDeviceInfo.model)) {
                const _tapoEnergyUsage = await device.getEnergyUsage();
                if (this.isEmpty(_tapoEnergyUsage)) {
                    throw new Error("tapo device energy not found.");
                }
                _tapoConnectResults.tapoEnergyUsage = _tapoEnergyUsage;
            }
            _tapoConnectResults.result = true;
            return _tapoConnectResults;
        } catch (error: any) {
            return { result: false, errorInf: error };
        } finally {
            // Proper session cleanup
            if (device && typeof device.disconnect === 'function') {
                try {
                    await device.disconnect();
                } catch (closeError) {
                    // Ignore close errors
                }
            }
        }
    }

    /**
     *
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @return {*}  {Promise<tplinkTapoConnectWrapperType.tapoConnectResults>}
     * @memberof tplinkTapoConnectWrapper
     */
    public async getTapoEnergyUsage(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'P110'): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        let device = null;
        try {
            // Use specified device type for energy monitoring functionality
            device = DeviceFactory.createDevice(_deviceType, _targetIp, { username: _email, password: _password }, 'getEnergyUsage');
            
            // Connect to device
            await device.connect();

            // get EnergyUsage
            const _tapoEnergyUsage = await device.getEnergyUsage();
            if (this.isEmpty(_tapoEnergyUsage)) {
                throw new Error("tapo device energy not found.");
            }
            return { result: true, tapoDeviceInfo: _tapoEnergyUsage };
        } catch (error: any) {
            return { result: false, errorInf: error };
        } finally {
            if (device && typeof device.disconnect === 'function') {
                try {
                    await device.disconnect();
                } catch (closeError) {
                    // Ignore close errors
                }
            }
        }
    }

    /**
     *
     *
     * @param {string} _targetIp
     * @returns {Promise< object >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOn(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'auto'): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Retry up to 3 times for session issues
        for (let attempt = 1; attempt <= 3; attempt++) {
            let device = null;
            try {
                // Use new ApiClient with proper session management
                const client = new ApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'turnOn');
                
                // Connect and turn on
                await device.connect();
                await device.on();
                return { result: true };
            } catch (error: any) {
                if (attempt < 3 && error.message && error.message.includes('Invalid terminal UUID')) {
                    console.log(`Retry attempt ${attempt + 1}/3 for UUID conflict...`);
                    // Wait longer for session conflicts
                    await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
                    continue;
                }
                return { result: false, errorInf: error };
            } finally {
                // Proper session cleanup
                if (device && typeof device.disconnect === 'function') {
                    try {
                        await device.disconnect();
                    } catch (closeError) {
                        // Ignore close errors
                    }
                }
            }
        }
        return { result: false, errorInf: new Error('Max retries exceeded') };
    }

    /**
     * set turn off
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoTurnOff(_email: string, _password: string, _targetIp: string, _deviceType: TapoDeviceType = 'auto'): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        // Retry up to 3 times for session issues
        for (let attempt = 1; attempt <= 3; attempt++) {
            let device = null;
            try {
                // Use new ApiClient with proper session management
                const client = new ApiClient(_email, _password);
                device = await client.createDevice(_targetIp, _deviceType, 'turnOff');
                
                // Connect and turn off
                await device.connect();
                await device.off();
                return { result: true };
            } catch (error: any) {
                if (attempt < 3 && error.message && error.message.includes('Invalid terminal UUID')) {
                    console.log(`Retry attempt ${attempt + 1}/3 for UUID conflict...`);
                    // Wait longer for session conflicts
                    await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
                    continue;
                }
                return { result: false, errorInf: error };
            } finally {
                // Proper session cleanup
                if (device && typeof device.disconnect === 'function') {
                    try {
                        await device.disconnect();
                    } catch (closeError) {
                        // Ignore close errors
                    }
                }
            }
        }
        return { result: false, errorInf: new Error('Max retries exceeded') };
    }

    /**
     * set brightness
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @param {number} _brightness
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoBrightness(_email: string, _password: string, _targetIp: string, _brightness: number): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        let device = null;
        try {
            if (_brightness < 0 || _brightness > 100) {
                throw "brightness out of range";
            }
            const client = new ApiClient(_email, _password);
            device = await client.l530(_targetIp);
            
            // Connect to device
            await device.connect();

            // Note: setBrightness is for bulb devices (L530), not plugs
            // This would require L530 bulb implementation
            throw new Error("Brightness control not available for plug devices");
        } catch (error: any) {
            return { result: false, errorInf: error };
        } finally {
            if (device && typeof device.disconnect === 'function') {
                try {
                    await device.disconnect();
                } catch (closeError) {
                    // Ignore close errors
                }
            }
        }
    }

    /**
     * 
     *
     * @param {string} _email
     * @param {string} _password
     * @param {string} _targetIp
     * @param {string} _colour
     * @returns {Promise< tplinkTapoConnectWrapperType.tapoConnectResults >}
     * @memberof tplinkTapoConnectWrapper
     */
    public async setTapoColour(_email: string, _password: string, _targetIp: string, _colour: string): Promise<tplinkTapoConnectWrapperType.tapoConnectResults> {
        let device = null;
        try {
            if (_colour === "") {
                throw "Incorrect colour value";
            }
            const client = new ApiClient(_email, _password);
            device = await client.l530(_targetIp);
            
            // Connect to device
            await device.connect();

            // Note: setColour is for bulb devices (L530), not plugs
            // This would require L530 bulb implementation
            throw new Error("Color control not available for plug devices");
        } catch (error: any) {
            return { result: false, errorInf: error };
        } finally {
            if (device && typeof device.disconnect === 'function') {
                try {
                    await device.disconnect();
                } catch (closeError) {
                    // Ignore close errors
                }
            }
        }
    }
}