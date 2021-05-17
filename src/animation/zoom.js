import anime from 'animejs'
import AnimationBase from './base'

// 类型常量
const modeType = {
  SHOW: 'enlarge',
  HIDE: 'narrow',
}
// 方向常量
const directions = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  BOTH: 'both',
}
// 默认参数
const defaultOptions = {
  delay: 500,
  duration: 2000,
  direction: directions.HORIZONTAL,
  mode: modeType.SHOW,
  loop: false,
}

const judgeScaleValue = (mode, direction) => {
  let values = []
  // 方向判断
  if (direction === directions.HORIZONTAL) {
    values = (mode === modeType.SHOW ? [0, 1] : [1, 1])
  } else if (direction === directions.VERTICAL) {
    values = (mode === modeType.SHOW ? [1, 0] : [1, 1])
  } else if (direction === directions.BOTH) {
    values = (mode === modeType.SHOW ? [0, 0] : [1, 1])
  }
  return values
}

// 比例缩放动画
export default class ZoomAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    this.elementNumber = this.options.targets.length
    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  play() {
    const {targets, delay, duration, mode, direction, loop} = this.options
    anime({
      targets,
      duration: duration * 0.8,
      delay: anime.stagger(duration / this.elementNumber / 5, {start: delay}),
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      scaleX: [
        judgeScaleValue(mode, direction)[0],
        judgeScaleValue(mode === modeType.SHOW ? modeType.HIDE : modeType.SHOW, direction)[0],
      ],
      scaleY: [
        judgeScaleValue(mode, direction)[1],
        judgeScaleValue(mode === modeType.SHOW ? modeType.HIDE : modeType.SHOW, direction)[1],
      ],
    })
  }

  start() {
    this.isAnimationStart = true
    this.event.has('start') && this.event.fire('start')
  }

  process(data) {
    this.event.has('process') && this.event.fire('process', data.progress)
  }

  end() {
    this.isAnimationStart = false
    this.event.has('end') && this.event.fire('end')
  }

  destroy() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
  }
}
