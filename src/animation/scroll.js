import * as d3 from 'd3'
import anime from 'animejs'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  delay: 2000,
  duration: 2000,
  offset: [0, 0],
  reverse: false,
  clone: false,
  loop: true,
}

export default class ScrollAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    const {clone, offset, reverse, targets} = this.options
    // 复制一份相同的元素，使得滚动动画连续
    if (clone) {
      // 复制的元素也是动画的移动对象
      const extraNodes = d3.selectAll(targets).clone(false).nodes()
      this.options.targets = Array.from(targets).concat(Array.from(extraNodes))
      // 统一在原来列表的末端追加复制的元素
      anime({
        targets: extraNodes,
        translateX: `+=${extraNodes.length * offset[0]}`,
        translateY: `+=${extraNodes.length * offset[1]}`,
        duration: 0,
      })
      // 在反方向情况下整体移动，使得滚动动画连续
      reverse && anime({
        targets: this.options.targets,
        translateX: `-=${offset[0]}`,
        translateY: `-=${offset[1]}`,
        duration: 0,
      })
    }
    this.elementNumber = this.options.targets.length
    this.active = reverse ? this.elementNumber - 1 : 0
  }

  play() {
    const {targets, delay, duration, offset, reverse} = this.options
    this.instance = anime({
      targets,
      duration,
      delay,
      keyframes: [{
        translateX: `${reverse ? '+=' : '-='}${offset[0]}`,
        translateY: `${reverse ? '+=' : '-='}${offset[1]}`,
        opacity: (el, i) => (this.active === i ? 0 : 1),
        duration,
      }, {
        translateX: (el, i, len) => (this.active === i ? `${reverse ? '-=' : '+='}${offset[0] * len}` : '+=0'),
        translateY: (el, i, len) => (this.active === i ? `${reverse ? '-=' : '+='}${offset[1] * len}` : '+=0'),
        opacity: 1,
        duration: 0,
      }],
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    })
    this.event.fire('play')
  }

  end() {
    this.isAnimationStart = false
    this.active = !this.options.reverse
      ? (this.active + 1) % this.elementNumber
      : (this.active + this.elementNumber - 1) % this.elementNumber
    this.event.fire('end')
    this.isAnimationAvailable && this.options.loop && this.play()
  }

  destroy() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
    this.event.fire('destroy')
  }
}
