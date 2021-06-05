import * as d3 from 'd3'
import anime from 'animejs'
import AnimationBase from './base'

// 默认参数
const defaultOptions = {
  offsetX: 0,
  offsetY: 0,
  delay: 2000,
  duration: 2000,
  reverse: false,
  loop: true,
  clone: false,
}

export default class ScrollAnimation extends AnimationBase {
  constructor(options, context) {
    super(defaultOptions, options, context)
    const {clone, offsetX, offsetY, reverse, targets} = this.options
    // 复制一份相同的元素，使得滚动动画连续
    if (clone) {
      // 复制的元素也是动画的移动对象
      const extraNodes = d3.selectAll(targets).clone(false)._groups[0]
      this.options.targets = Array.from(targets).concat(Array.from(extraNodes))
      // 统一在原来列表的末端追加复制的元素（svg 会停留在原地）
      anime({
        targets: extraNodes,
        translateX: `+=${extraNodes.length * offsetX}`,
        translateY: `+=${extraNodes.length * offsetY}`,
        duration: 0,
      })
      // 在反方向情况下整体移动，使得滚动动画连续
      reverse && anime({
        targets: this.options.targets,
        translateX: `-=${offsetX}`,
        translateY: `-=${offsetY}`,
        duration: 0,
      })
    }
    this.elementNumber = this.options.targets.length
    this.activeIndex = reverse ? this.elementNumber - 1 : 0
  }

  play() {
    const {targets, delay, duration, offsetX, offsetY, reverse} = this.options
    anime({
      targets,
      duration,
      delay,
      keyframes: [{
        translateX: `${reverse ? '+=' : '-='}${offsetX}`,
        translateY: `${reverse ? '+=' : '-='}${offsetY}`,
        opacity: (el, i) => (this.activeIndex === i ? 0 : 1),
        duration,
      }, {
        translateX: (el, i, len) => (this.activeIndex === i ? `${reverse ? '-=' : '+='}${offsetX * len}` : '+=0'),
        translateY: (el, i, len) => (this.activeIndex === i ? `${reverse ? '-=' : '+='}${offsetY * len}` : '+=0'),
        opacity: 1,
        duration: 0,
      }],
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    })
    this.event.has('play') && this.event.fire('play')
  }

  end() {
    this.isAnimationStart = false
    this.activeIndex = !this.options.reverse
      ? (this.activeIndex + 1) % this.elementNumber
      : (this.activeIndex + this.elementNumber - 1) % this.elementNumber
    this.event.has('end') && this.event.fire('end')
    this.isAnimationAvailable && this.options.loop && this.play()
  }

  destroy() {
    anime.remove(this.options.targets)
    this.isAnimationAvailable = false
    this.event.has('destroy') && this.event.fire('destroy')
  }
}
