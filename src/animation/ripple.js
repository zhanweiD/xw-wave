import * as d3 from 'd3'
import anime from 'animejs'
import AnimationBase from './base'
import uuid from '../../../common/uuid'


/**
 * 寻找子节点类型
 * todo: 目前这个方法不通用，得继续优化，可能存在type未找到或者container下为多个元素的情况
 */
const findNodeType = ({targets, index, type}) => {
  const container = targets.children ? targets.children[0] : targets._groups[0][index]
  if (container.tagName === type) {
    return container
  }
  return findNodeType({targets: container, type})
}

// 默认参数
const defaultOptions = {
  delay: 1000,
  duration: 3000,
  loop: true,
}

const animationCount = 0

/**
 * 折线示例动画
 */
// const rippleAnimation = new RippleAnimation({
//   targets: this.root.selectAll('.wave-line-node'),
//   delay: 2000,
//   duration: 2000,
//   scale: 5,
//   // delay: loopAnimationDelay,
//   // duration: loopAnimationDuration,
//   loop: true,
// }, this)

// rippleAnimation.play()

/**
 * 光晕动画
 * 准备：
 *  1. 背景涟漪类型
 *     target: root
 *  2. 普通节点涟漪类型
 *     target: node
 *  3. 普通节点警告波纹类型
 *     target: node
 */
export default class RippleAnimation extends AnimationBase {
  constructor(options, context) {
    super(options)
    this.options = {...defaultOptions, ...options}

    const target = this.options.targets._groups[0]
    this._sourceTarget = target

    this.class = `wave-animation-ripple-${uuid()}`

    new Array(target.length).fill(1).map((v, index) => {
      const {parentNode, attributes} = target[index]

      let {r, fill, cx, cy} = attributes

      const selector = d3.select(parentNode)

      new Array(3).fill(1).forEach((item, i) => {
        selector
          .append('circle')
          .attr('class', this.class)
          .attr('r', r.value)
          .attr('stroke', fill.value)
          .attr('fill', '#0000')
          .style('opacity', 0)
          .style('transform', `translate(${cx ? cx.value : 0}px,${cy ? cy.value : 0}px)`)
          // .attr('cx', cx ? cx.value : 0)
          // .attr('cy', cy ? cy.value : 0)
      })
    })

    this.isAnimationStart = false
    this.isAnimationAvailable = true
  }

  /**
   * 播放
   */
  play() {
    const {delay, duration, direction, loop, scale} = this.options
    const configs = {
      targets: `.${this.class}`,
      loop,
      duration,
      opacity: [
        {value: 0, duration: 1, easing: 'linear'},
        {value: 1, duration: (duration - 1) / 2, easing: 'linear'},
        {value: 0, duration: (duration - 1) / 2, easing: 'linear'},
      ],
      scale: scale || 1.5,
      delay: anime.stagger(duration / 3),
      update: this.process.bind(this),
      loopBegin: this.start.bind(this),
      loopComplete: this.end.bind(this),
      easing: 'linear',
    }

    this.animationInstance = anime(configs)
  }

  /**
   * 动画开始位置钩子[轮播]
   */
  start(data) {
    this.isAnimationStart = true
    this.event.has('start') && this.event.fire('start')
  }

  /**
   * 动画执行过程中钩子[轮播]
   */
  process(data) {
    this.event.has('process') && this.event.fire('process', data.progress)
  }

  /**
   * 动画结束钩子[轮播]
   */
  end() {
    this.isAnimationStart = false
    this.event.has('end') && this.event.fire('end')
  }

  /**
   * 动画销毁钩子
   */
  destory() {
    this.isAnimationAvailable = false
    this.gradient.remove()
    this.lights.remove()
  }
}

// d3实现逻辑

// export const rippleAnimate = ({
//   // 容器
//   targets = '',
//   type = 'circle', // 节点类型: circle || rect
//   loop = true, // 颜色，如果传递了则使用这个颜色，如果传递的是字符串，则为单色，如果是数组，则按下标取值
//   colors,
//   // 放大幅度
//   scale= 1.5,
//   // 过滤函数：后续可以考虑回调一下
//   filter = () => {},
// }) => {
//   const getColor = index => {
//     if (!colors) return false
//     if (typeof colors === 'string') {
//       return colors
//     }
//     return colors[index]
//   }
//   let container = ''
//   // 方便向后衍生更多类型
//   switch (type) {
//     // 球型
//     case 'circle':
//       container = targets.insert(type)
//         .attr('class', 'animate-halo-circle')
//         .attr('r', (d, index, element) => findNodeType({targets, index, type}).r.baseVal.value)
//         .attr('stroke', (d, index, element) => getColor(index) || findNodeType({targets, index, type}).attributes.fill.value)
//         .attr('fill', '#fff1')
//       break
//     // 球型
//     case 'background':
//       const {width, height} = targets._groups[0][0].attributes
//       const rootContainer = targets.insert('g', ":first-child")
//         .attr('class', 'animate-halo-background-root')
//         .attr('transform', `translate(${width.value / 2}, ${height.value / 2})`)

//       container = rootContainer.insert('circle')
//         .attr('class', 'animate-halo-background')
//         .attr('r', Math.min(width.value, height.value) / 2)
//         .attr('fill', '#fff1')
//       break
//     // 矩型
//     case 'rect':
//       container = targets.insert(type)
//         .attr('class', 'animate-halo-rect')
//         .attr('width', (d, index, element) => findNodeType({targets, index, type}).attributes.width.value)
//         .attr('height', (d, index, element) => findNodeType({targets, index, type}).attributes.height.value)
//         .attr('stroke', (d, index, element) => findNodeType({targets, index, type}).attributes.fill.value)
//         .attr('stroke', '#fff8')
//       break
//     default:
//       break
//   }

//   // 循环动画
//   const loopAnimation = () => {
//     container.transition()
//       .style('transform', 'scale(1)')
//       .attr('opacity', '0')
//       .duration(50)
//       .transition()
//       .attr('opacity', '0.5')
//       .duration(250)
//       .transition()
//       .duration(1300)
//       .style('transform', `scale(${scale})`)
//       .attr('opacity', '0')
//       .ease(d3.easeLinear)
//       .on('end', loop && loopAnimation)
//   }
//   // 是否执行控制？
//   loopAnimation()
// }

// export const ripple = options => {
//   new Array(4).fill(1).map((v, i) => setTimeout(() => rippleAnimate(options), (i + 1) * 400))
// }

// export default ripple
