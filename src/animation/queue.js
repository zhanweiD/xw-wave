import AnimationBase from './base'
import FadeAnimation from './fade'
import ZoomAnimation from './zoom'
import ScanAnimation from './scan'
import ScrollAnimation from './scroll'
import EmptyAnimation from './empty'
import MoveAnimation from './move'
import BreatheAnimation from './breathe'
import EraseAnimation from './erase'
import createUuid from '../utils/uuid'
import PathAnimation from './path'

const mapping = {
  fade: FadeAnimation,
  zoom: ZoomAnimation,
  scan: ScanAnimation,
  scroll: ScrollAnimation,
  empty: EmptyAnimation,
  breathe: BreatheAnimation,
  move: MoveAnimation,
  erase: EraseAnimation,
  path: PathAnimation,
}

const defaultOptions = {
  loop: false,
}

export default class AnimationQueue extends AnimationBase {
  constructor(options) {
    super(defaultOptions, options)
    // can start play or not
    this.isReady = false
    // initialize animation queue
    const animationHead = {id: createUuid(), instance: new EmptyAnimation()}
    // queue must has a head animation
    animationHead.instance.event.on('start', () => this.start())
    animationHead.instance.event.on('end', () => this.end())
    this.queue = [animationHead]
  }

  /**
   * run the callback after all animations done
   * @param {Array<AnimationBase>} animations 
   * @param {Function} callback 
   */
  #bind = (animations, callback) => {
    let completeCount = 0
    animations.forEach(({instance}) => instance.event.on('end', () => {
      if (++completeCount === animations.length) {
        // reset count and run the callback
        completeCount = 0
        callback()
      }
    }))
    // animations that completed bind
    return animations
  }

  /**
   * connect discrete animations to sequence animations
   * @param {Array|Function} priorityConfig
   */
  connect(priorityConfig) {
    // initialize life cycle
    this.queue.forEach(({instance}) => {
      instance.event.off('start')
      instance.event.off('end')
    })
    // default by index of array
    let finalPriority
    if (Array.isArray(priorityConfig)) {
      finalPriority = [0, ...priorityConfig]
    } else if (typeof priorityConfig === 'function') {
      finalPriority = [0, ...priorityConfig(this.queue.slice(1))]
    } else {
      finalPriority = this.queue.map((item, index) => index)
    }
    // group animations by priority config
    const groupedAnimationQueue = new Array(Math.max(...finalPriority) + 1).fill().map(() => [])
    finalPriority.forEach((priority, animationIndex) => {
      groupedAnimationQueue[priority].push(this.queue[animationIndex])
    })
    // connect the grouped animations except head
    groupedAnimationQueue.reduce((previousAnimations, currentAnimations, priority) => {
      // queue capture item's events
      currentAnimations.forEach(animation => {
        const mapToState = state => ({id: animation.id, priority, state})
        const [startState, processState, endState] = ['start', 'process', 'end'].map(mapToState)
        animation.instance.event.on('start', () => this.process(startState))
        animation.instance.event.on('process', data => this.process({...processState, data}))
        animation.instance.event.on('end', () => this.process(endState))
      })
      // last animations bind queue's 'end' event
      if (priority === Math.max(...finalPriority)) this.#bind(currentAnimations, () => this.end())
      // previous animation group fire next animation group
      this.#bind(previousAnimations, () => currentAnimations.forEach(({instance}) => instance.play()))
      return currentAnimations
    })
    // connet done
    this.isReady = true
    return this
  }

  /**
   * add the animation to the queue
   * @param {String} type animation type
   * @param {Object} options animation schema
   * @param {*} context
   */
  push(type, options, context) {
    const createQueueableAnimation = animation => this.queue.push({
      id: options.id || createUuid(),
      instance: animation,
    })
    // create new queue item by type
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
    // create a animation lead to reconnect
    this.isReady = false
    return this
  }

  /**
   * remove a animation from queue
   * @param {String} id
   */
  remove(id) {
    const index = this.queue.findIndex(item => item.id === id)
    // remove a animation lead to reconnect
    if (index !== -1) {
      this.isReady = false
      return this.queue.splice(index, 1)
    } 
    this.log.error('The Animation does not exist', id)
    return null
  }

  play() {
    !this.isReady && this.queue.length > 1 && this.connect()
    this.queue[0].instance.play()
  }

  end() {
    if (this.isAnimationAvailable && this.options.loop && this.queue.length > 1) {
      this.queue.forEach(({instance}) => {
        instance.destroy()
        instance.init()
      })
      this.play()
    }
  }

  destroy() {
    this.queue.forEach(({instance}) => instance.destroy())
  }
}
