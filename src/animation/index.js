import FadeAnimation from './fade'
import ZoomAnimation from './zoom'
import ScanAnimation from './scan'
import ScrollAnimation from './scroll'
import EmptyAnimation from './empty'
import MoveAnimation from './move'
import BreatheAnimation from './breathe'
import EraseAnimation from './erase'
import AnimationQueue from './queue'

export {
  // 动画队列
  AnimationQueue,

  // 入场
  FadeAnimation,
  ZoomAnimation,
  EraseAnimation,

  // 轮播
  ScanAnimation, // 扫光
  ScrollAnimation, // 滚动
  BreatheAnimation, // 呼吸

  // 其他
  EmptyAnimation,
  MoveAnimation,
}  
