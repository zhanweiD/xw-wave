import AnimationBase from './base'
import {createUuid} from '../util'
import {AnimationMap, EmptyAnimation as Empty} from './index'

// 默认参数
const defaultOptions = {
  loop: false,
}

// 动画队列类
export default class AnimationQueue extends AnimationBase {
  constructor(options) {
    super(options)
    this.isAnimationStart = false
    this.isAnimationAvailable = true
    this.isReady = false
    this.options = {...defaultOptions, ...options}
    // 初始化动画队列
    const animationHead = {id: createUuid(), instance: new Empty()}
    // 第一个元素绑定动画序列的 start 生命周期
    animationHead.instance.event.on('process', () => this.start())
    this.animationQueue = [animationHead]
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
   * @param {优先级数组或者映射函数，默认为数组下标顺序} priorityConfig 
   */
  connect(priorityConfig) {
    // 初始化每个动画对象的生命周期
    this.animationQueue.forEach(({instance}) => {
      instance.event.off('start')
      instance.event.off('end')
    })
    // 序列优先级，默认为数组下标序
    let finalPriority
    if (Array.isArray(priorityConfig)) {
      finalPriority = [0, ...priorityConfig]
    } else if (typeof priorityConfig === 'function') {
      finalPriority = [0, ...priorityConfig(this.animationQueue.slice(1))]
    } else {
      finalPriority = this.animationQueue.map((item, index) => index)
    }
    // 根据优先级分组动画
    const groupedAnimationQueue = new Array(Math.max(...finalPriority) + 1).fill().map(() => [])
    finalPriority.forEach((priority, animationIndex) => {
      groupedAnimationQueue[priority].push(this.animationQueue[animationIndex])
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
    // 创建一个可以序列化的动画对象（带ID）
    const createQueueableAnimation = animation => this.animationQueue.push({
      id: options.id || createUuid(),
      instance: animation,
    })
    // 根据类型创建动画
    if (type === 'function') {
      const animation = new Empty()
      animation.event.on('process', options)
      createQueueableAnimation(animation)
    } else if (AnimationMap[type]) {
      createQueueableAnimation(new AnimationMap[type](options, context))
    } else {
      this.log.error('Animation Type Error', type)
      return null
    }
    // 新的动画加入，需要再次 connect
    this.isReady = false
    return this
  }

  /**
   * 获取现有的一个动画实例
   * @param {动画ID} id
   */
  get(id) {
    return this.animationQueue.find(item => item.id === id)
  }

  /**
   * 移除序列中已有的一个动画
   * @param {动画ID} id
   */
  remove(id) {
    const index = this.animationQueue.findIndex(item => item.id === id)
    if (index !== -1) {
      // 删除旧的动画，需要再次 connect
      this.isReady = false
      return this.animationQueue.splice(index, 1)
    } 
    this.log.error('The Animation does not exist', id)
    return null
  }

  // 控制函数，开启动画
  play() {
    if (this.isAnimationStart || !this.isAnimationAvailable) {
      this.isAnimationStart && this.log.error('The animation is already started!')
      !this.isAnimationAvailable && this.log.error('The animation is not available!')
    } else {
      // 重新连接，开始动画
      !this.isReady && this.connect()
      this.animationQueue[0].instance.play()
    }
    return this
  }

  // 图表生命周期，标志动画开始
  start() {
    this.isAnimationStart = true
    this.event.has('start') && this.event.fire('start')
  }

  // 图表生命周期，标志动画进行时
  process(data) {
    this.event.has('process') && this.event.fire('process', data)
  }

  // 图表生命周期，标志动画结束
  end() {
    this.isAnimationStart = false
    this.event.has('end') && this.event.fire('end')
    this.isAnimationAvailable && this.options.loop && this.play()
  }

  // 控制函数，销毁动画
  destory() {
    this.isAnimationAvailable = false
    this.animationQueue.forEach(item => item.destory())
  }
}
