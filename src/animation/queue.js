import AnimationBase from './base'
import FadeAnimation from './fade'
import ZoomAnimation from './zoom'
import ScanAnimation from './scan'
import ScrollAnimation from './scroll'
import EmptyAnimation from './empty'
import MoveAnimation from './move'
import BreatheAnimation from './breathe'
import EraseAnimation from './erase'
import createUuid from '../util/uuid'

const mapping = {
  fade: FadeAnimation,
  zoom: ZoomAnimation,
  scan: ScanAnimation,
  scroll: ScrollAnimation,
  empty: EmptyAnimation,
  breathe: BreatheAnimation,
  move: MoveAnimation,
  erase: EraseAnimation,
}

const defaultOptions = {
  loop: false,
}

// 动画队列类
export default class AnimationQueue extends AnimationBase {
  constructor(options) {
    super(defaultOptions, options)
    // 动画队列是否连接就绪
    this.isReady = false
    // 初始化动画队列
    const animationHead = {id: createUuid(), instance: new EmptyAnimation()}
    // 第一个元素绑定动画序列的 start 生命周期
    animationHead.instance.event.on('process', () => this.start())
    this.queue = [animationHead]
  }

  /**
   * 用于在一组动画全部完成后执行某段代码（只绑定不执行）
   * @param {动画数组} animations 
   * @param {回调函数} callback 
   */
  bind = (animations, callback) => {
    let completeCount = 0
    animations.forEach(({instance}) => instance.event.on('end', () => {
      if (++completeCount === animations.length) {
        // 重置计数并且触发数据结束的事件
        completeCount = 0
        callback()
      }
    }))
    // 返回连接后的动画数组
    return animations
  }

  /**
   * 离散动画链接成序列动画
   * @param {Array | Function} priorityConfig 优先级数组或者映射函数，默认为数组下标顺序
   */
  connect(priorityConfig) {
    // 初始化每个动画对象的生命周期
    this.queue.forEach(({instance}) => {
      instance.event.off('start')
      instance.event.off('end')
    })
    // 序列优先级，默认为数组下标序
    let finalPriority
    if (Array.isArray(priorityConfig)) {
      finalPriority = [0, ...priorityConfig]
    } else if (typeof priorityConfig === 'function') {
      finalPriority = [0, ...priorityConfig(this.queue.slice(1))]
    } else {
      finalPriority = this.queue.map((item, index) => index)
    }
    // 根据优先级分组动画
    const groupedAnimationQueue = new Array(Math.max(...finalPriority) + 1).fill().map(() => [])
    finalPriority.forEach((priority, animationIndex) => {
      groupedAnimationQueue[priority].push(this.queue[animationIndex])
    })
    // 对分组后的动画进行连接
    groupedAnimationQueue.reduce((previousAnimations, currentAnimations, priority) => {
      // 子动画的每个生命周期都是动画序列的 “process”
      currentAnimations.forEach(animation => {
        const mapToState = state => ({id: animation.id, priority, state})
        const [startState, processState, endState] = ['start', 'process', 'end'].map(mapToState)
        animation.instance.event.on('start', () => this.process(startState))
        animation.instance.event.on('process', data => this.process({...processState, data}))
        animation.instance.event.on('end', () => this.process(endState))
      })
      // 最后一组元素绑定动画序列的 end 生命周期
      if (priority === Math.max(...finalPriority)) this.bind(currentAnimations, () => this.end())
      // 前一优先级动画全部结束后启动当前优先级的动画
      this.bind(previousAnimations, () => currentAnimations.forEach(({instance}) => instance.play()))
      return currentAnimations
    })
    // 连接完毕，动画可以启动
    this.isReady = true
    return this
  }

  /**
   * 向队列中添加一个动画
   * @param {动画类型} type
   * @param {动画配置参数} options
   * @param {上下文环境} context
   */
  push(type, options, context) {
    // 创建一个可以序列化的动画对象（带Id）
    const createQueueableAnimation = animation => this.queue.push({
      id: options.id || createUuid(),
      instance: animation,
    })
    // 根据类型创建动画
    if (type === 'function') {
      const animation = new EmptyAnimation()
      animation.event.on('process', options)
      createQueueableAnimation(animation)
    } else if (type === 'queue') {
      createQueueableAnimation(options)
    } else if (mapping[type]) {
      createQueueableAnimation(new mapping[type]({...options, loop: false}, context))
    } else {
      this.log.error('Animation Type Error', type)
      return null
    }
    // 新的动画加入，需要再次 connect
    this.isReady = false
    return this
  }

  /**
   * 移除序列中已有的一个动画
   * @param {动画Id} id
   */
  remove(id) {
    const index = this.queue.findIndex(item => item.id === id)
    // 删除旧的动画，需要再次 connect
    if (index !== -1) {
      this.isReady = false
      return this.queue.splice(index, 1)
    } 
    this.log.error('The Animation does not exist', id)
    return null
  }

  play() {
    if (this.isAnimationStart || !this.isAnimationAvailable) {
      this.isAnimationStart && this.log.warn('The animation is already started!')
      !this.isAnimationAvailable && this.log.error('The animation is not available!')
    } else {
      // 重新连接，开始动画
      !this.isReady && this.connect()
      this.queue[0].instance.play()
    }
    this.event.has('play') && this.event.fire('play')
    return this
  }

  end() {
    this.isAnimationStart = false
    this.isAnimationAvailable && this.options.loop && this.queue.length !== 1 && this.play()
    this.event.has('end') && this.event.fire('end')
  }

  destroy() {
    this.isAnimationAvailable = false
    this.queue.forEach(item => item.instance.destroy())
    this.event.has('destroy') && this.event.fire('destroy')
  }
}
