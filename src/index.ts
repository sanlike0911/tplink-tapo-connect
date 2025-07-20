export * from './types';
export * from './core';
export * from './devices';

import { P100Plug, P105Plug, P110Plug, P115Plug } from './devices';
import { TapoCredentials } from './types';

export class TapoConnect {
  /**
   * Create a P100 Smart Plug instance
   * P100 is a basic smart plug without energy monitoring
   */
  public static createP100Plug(ip: string, credentials: TapoCredentials): P100Plug {
    return new P100Plug(ip, credentials);
  }

  /**
   * Create a P105 Smart Plug instance  
   * P105 is a basic smart plug without energy monitoring
   */
  public static createP105Plug(ip: string, credentials: TapoCredentials): P105Plug {
    return new P105Plug(ip, credentials);
  }

  /**
   * Create a P110 Smart Plug instance
   * P110 is a smart plug with energy monitoring capabilities
   */
  public static createP110Plug(ip: string, credentials: TapoCredentials): P110Plug {
    return new P110Plug(ip, credentials);
  }

  /**
   * Create a P115 Smart Plug instance
   * P115 is a smart plug with energy monitoring capabilities  
   */
  public static createP115Plug(ip: string, credentials: TapoCredentials): P115Plug {
    return new P115Plug(ip, credentials);
  }
}

export default TapoConnect;