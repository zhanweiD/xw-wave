import anime from 'animejs'
import AnimationBase from './base'

// 类型常量
const types = {
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
  type: types.SHOW,
  loop: false,
}

const judgeScaleValue = (type, direction) => {
  let values = []
  // 方向判断
  if (direction === directions.HORIZONTAL) {
    values = (type === types.SHOW ? [0, 1] : [1, 1])
  } else if (direction === directions.VERTICAL) {
    values = (type === types.SHOW ? [1, 0] : [1, 1])
  } else if (direction === directions.BOTH) {
    values = (type === types.SHOW ? [0, 0] : [1, 1])
  }
  return values
}

// 比例缩放动画
export default class ZoomAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    this.options = {...defaultOptions, ...options, targets: context.root.selectAll(options.targets)._groups[0]}
    this.elementNumber = context.root.selectAll(options.targets)._groups[0].length
    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  play() {
    const {targets, delay, duration, type, direction, loop} = this.options
    anime({
      targets,
      duration: duration * 0.8,
      delay: anime.stagger(duration / this.elementNumber / 5, {start: delay}),
      loop,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      scaleX: [
        judgeScaleValue(type, direction)[0],
        judgeScaleValue(type === types.SHOW ? types.HIDE : types.SHOW, direction)[0],
      ],
      scaleY: [
        judgeScaleValue(type, direction)[1],
        judgeScaleValue(type === types.SHOW ? types.HIDE : types.SHOW, direction)[1],
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

  destory() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
  }
}
