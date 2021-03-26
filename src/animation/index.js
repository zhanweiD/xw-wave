import FadeAnimation from './fade'
import ZoomAnimation from './zoom'
import ScanAnimation from './scan'
import ScrollAnimation from './scroll'
import RippleAnimation from './ripple'
import Shake from './shake'
import MoveAnimation from './move'
import TrackAnimation from './track'
import EmptyAnimation from './empty'
import BreatheAnimation from './breathe'

const AnimationMap = {
  fade: FadeAnimation,
  zoom: ZoomAnimation,
  scan: ScanAnimation,
  scroll: ScrollAnimation,
  ripple: RippleAnimation,
  move: MoveAnimation,
  shake: Shake,
  track: TrackAnimation,
  empty: EmptyAnimation,
  breathe: BreatheAnimation,
}

export {
  // 动画映射
  AnimationMap,

  // 入场
  FadeAnimation,
  ZoomAnimation,

  // 轮播
  ScanAnimation, // 扫光
  RippleAnimation, // 光晕
  ScrollAnimation, // 滚动
  Shake, // 摇晃
  TrackAnimation, // 轨迹
  BreatheAnimation, // 呼吸

  // 其他
  MoveAnimation,
  EmptyAnimation,
}
