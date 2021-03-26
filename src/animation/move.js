import anime from 'animejs'
import {isFunction} from 'lodash'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 1000,
  loop: false,
  moveDistance: [0, 0],
  easing: 'linear',
}

// 全选元素
const selectAllElement = (context, targets) => {
  let elementArray = []
  if (!context) {
    elementArray = []
  } else if (context?.root?.selectAll(targets)?._groups) {
    [elementArray] = context.root.selectAll(targets)._groups
  } else {
    elementArray = context.querySelectorAll(targets)
  }
  return elementArray
}

export default class MoveAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    // 动画参数
    this.options = {...defaultOptions, ...options, targets: selectAllElement(context, options.targets)}
    // 动画控制
    this.isAnimationStart = false
    this.isAnimationAvailable = true
    // 转换
  }

  play() {
    const {isAnimationStart, isAnimationAvailable} = this
    // 动画开始或为就绪状态均不能play成功
    if (isAnimationStart || !isAnimationAvailable) {
      return
    }
    const {targets, delay, duration, loop, moveDistance, easing} = this.options
    const [moveDistanceX, moveDistanceY] = moveDistance
    anime({
      targets,
      duration,
      delay,
      loop,
      easing,
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      translateX: {
        value: (element, index, length) => {
          return `+=${isFunction(moveDistanceX) ? moveDistanceX({element, index, length}) : moveDistanceX}`
        },
      },
      translateY: {
        value: (element, index, length) => {
          return `+=${isFunction(moveDistanceY) ? moveDistanceY({element, index, length}) : moveDistanceY}`
        },
      },
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
