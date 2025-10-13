// Hotel Plugin - Main Export File
export { HotelPlugin } from './hotel-plugin';

// Register the plugin
import { registerPlugin } from '@/core/plugin-registry';
import { HotelPlugin } from './hotel-plugin';

registerPlugin(HotelPlugin);
