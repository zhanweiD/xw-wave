import Fade from './fade'
import Zoom from './zoom'
import Scan from './scan'
import Scroll from './scroll'
import Empty from './empty'
import Move from './move'
import Breathe from './breathe'
import Erase from './erase'
import Queue from './queue'

export {
  // 动画队列
  Queue,

  // 入场
  Fade, // 淡入淡出
  Zoom, // 缩放
  Erase, // 擦除

  // 轮播
  Scan, // 扫光
  Scroll, // 滚动
  Breathe, // 呼吸

  // 其他
  Empty, // 函数或计时器
  Move, // 移动
}  
