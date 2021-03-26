import anime from 'animejs'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  delay: 0,
  duration: 2000,
  loop: false,
}
// 动画生成ID
let count = 0

// 光晕滤镜
const createFilter = parentNode => {
  const filter = parentNode.append('filter')
    .attr('id', `breatheAnimation${++count}`)
    .attr('x', '-500%')
    .attr('y', '-500%')
    .attr('width', '1000%')
    .attr('height', '1000%')
  filter.append('feOffset')
    .attr('result', 'offOut')
    .attr('in', 'SourceGraphic')
    .attr('dx', 0)
    .attr('dy', 0)
  const targets = filter.append('feGaussianBlur')
    .attr('result', 'blurOut')
    .attr('in', 'offOut')
    .attr('stdDeviation', 10)
  filter.append('feBlend')
    .attr('in', 'SourceGraphic')
    .attr('in2', 'blurOut')
    .attr('mode', 'lighten')
  return targets
}

export default class BreatheAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    this.options = {...defaultOptions, ...options}
    this.extraNode = context.root.append('defs')
    this.targets = createFilter(this.extraNode)
    this.isAnimationStart = false
    this.isAnimationAvailable = true
    // 给元素添加光晕滤镜
    context.root.selectAll(options.targets).attr('filter', `url(#breatheAnimation${count})`)
  }

  play() {
    const {targets, delay, duration, loop} = this.options
    this.instance = anime({
      targets: [this.targets._groups[0], targets],
      duration: duration * 0.5,
      delay,
      loop,
      opacity: [1, 0.3],
      stdDeviation: [10, 0],
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      direction: 'alternate',
      easing: 'linear',
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
    this.instance.remove()
    this.extraNode.remove()
    this.isAnimationAvailable = false
  }
}
