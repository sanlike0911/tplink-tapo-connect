export * from './types';
export * from './core';
export * from './devices';

import { P105Plug } from './devices';
import { TapoCredentials } from './types';

export class TapoConnect {
  public static createP105Plug(ip: string, credentials: TapoCredentials): P105Plug {
    return new P105Plug(ip, credentials);
  }
}

export default TapoConnect;