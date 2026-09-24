import { env } from '@/config/env'; import type { BusinessDataProvider } from './dataProvider'; import { ApiDataProvider } from './apiDataProvider'; import { LocalDataProvider } from './localDataProvider';
let provider:BusinessDataProvider|null=null;
export function getDataProvider():BusinessDataProvider{if(!provider)provider=env.dataMode==='api'?new ApiDataProvider():new LocalDataProvider();return provider}
