import {makeProject} from '@motion-canvas/core';
import clusterFlow from './scenes/clusterFlow?scene';
import jobFlow from './scenes/jobFlow?scene';
import backfill from './scenes/backfill?scene';

/**
 * 一個專案可以有多個場景，播放時會依序接著播。
 * 要單獨播某一個場景，把另一個從 scenes 陣列拿掉即可。
 */
export default makeProject({
  scenes: [clusterFlow, jobFlow, backfill],
});
