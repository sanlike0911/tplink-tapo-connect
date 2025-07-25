import { TapoDeviceInfo } from './base';

// P105DeviceInfo is now just an alias for TapoDeviceInfo
// All plug devices follow the same structure
export type P105DeviceInfo = TapoDeviceInfo;

export interface P105UsageInfo {
  todayRuntime: number;
  monthRuntime: number;
  todayEnergy: number;
  monthEnergy: number;
  currentPower: number;
  onTime?: number;
}

export interface HubDeviceInfo extends TapoDeviceInfo {
  deviceType: 'SMART.TAPOHUB';
  model: 'H100';
  childDevices: string[];
}

export interface ChildDeviceListResponse {
  device_list: Array<{
    device_id: string;
    nickname: string;
    model: string;
    category: string;
    status: 'online' | 'offline';
    battery_percentage?: number;
    last_activity?: string;
  }>;
}