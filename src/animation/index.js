import FadeAnimation from './fade'
import ZoomAnimation from './zoom'
import ScanAnimation from './scan'
import ScrollAnimation from './scroll'
import EmptyAnimation from './empty'
import MoveAnimation from './move'
import BreatheAnimation from './breathe'
import EraseAnimation from './erase'

const AnimationMap = {
  fade: FadeAnimation,
  zoom: ZoomAnimation,
  scan: ScanAnimation,
  scroll: ScrollAnimation,
  empty: EmptyAnimation,
  breathe: BreatheAnimation,
  move: MoveAnimation,
  erase: EraseAnimation,
}

export {
  // 动画映射
  AnimationMap,

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
