// import * as d3 from 'd3'
import anime from 'animejs'
import AnimationBase from './base'

/**
* 缓动
* @丛鱼
*/

const defaultOptions = {
  delay: 0,
  duration: 2000,
  // 偏移范围
  translateRange: [0, 100],
  // 轮播
  loop: true,
  // 缓动类型
  easing: 'cubicBezier(.5, .5, .1, .3)',
}
export default class shakeAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    const _options = {...defaultOptions, ...options}
    this.options = _options
    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  play() {
    const {targets, delay, duration, translateRange, loop, easing} = this.options

    this.container = typeof targets === 'object' && targets._groups ? targets._groups[0] : targets
    const randomValues = () => {
      anime({
        targets: this.container,
        translateX: () => {
          return anime.random(translateRange[0], translateRange[1])
        },
        translateY: () => {
          return anime.random(translateRange[0], translateRange[1])
        },
        easing,
        duration,
        delay,
        update: this.process.bind(this),
        loopBegin: this.start.bind(this),
        loopComplete: this.end.bind(this),
        complete: loop && randomValues,
      })
    }

    randomValues()
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
    anime.remove(this.container)
    this.isAnimationAvailable = false
  }
}

// d3.js 方法
// const shakeAnimation = ({targets, delay = 0, duration = 1000, translate = () => {}, loop = true}, _this) => {
//   const container = typeof targets === 'string' ? _this.selectAll(targets) : targets
//   console.log(container)

//   const loopAnimation = element => {
//     element.transition()
//       .duration(duration)
//       // .style('transform', (d, i) => `translate(${Math.random() * 30}px, ${Math.random() * 30}px) rotate(${180}deg) scale(3)`)
//       // .transition()
//       // .duration(duration)
//       // .style('transform', (d, i) => `translate(${Math.random() * 30}px, ${Math.random() * 30}px) rotate(${0}deg) scale(1)`)
//       .style('transform', translate)

//       .on('end', (d, i, e) => {
//         loop && loopAnimation(d3.select(e[i]))
//       })
//   }
//   loopAnimation(container)
// }
