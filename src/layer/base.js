import {isArray, isEqual, merge} from 'lodash'
import Animation from '../animation'
import {formatNumber} from '../util/format'
import getTextWidth from '../util/text-width'
import createEvent from '../util/create-event'
import Selector from '../util/selector'
import basicMapping from '../draw'
import createLog from '../util/create-log'

// text position attached to the point
const positionType = {
  CENTER: 'center',
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
  LEFTTOP: 'left-top',
  LEFTBOTTOM: 'left-bottom',
  RIGHTTOP: 'right-top',
  RIGHTBOTTOM: 'right-bottom',
}

// some constants
export const scaleTypes = ['scaleX', 'scaleY', 'scaleXT', 'scaleYR', 'scaleAngle', 'scaleRadius', 'scalePosition']
export const commonEvents = ['click', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'mousedown']
export const tooltipEvents = ['mouseover', 'mouseout', 'mousemove']

export default class LayerBase {
  #backupData = {}

  #backupEvent = {}

  #backupAnimation = {
    options: {},
  }

  constructor(layerOptions, waveOptions, sublayers) {
    this.options = merge(layerOptions, waveOptions)
    this.sublayers = sublayers || []
    this.tooltipTargets = []
    this.root = null
    this.className = null
    this.#createEvent()
    this.log = createLog('src/layer/base')
    this.event = createEvent('src/layer/base')
    this.sublayers.forEach(name => this.#backupData[name] = [])
    this.selector = new Selector(this.options.engine)
  }

  setData() { 
    this.log.warn('LayerBase: The subclass does not implemented the setData method')
  }

  setStyle() { 
    this.log.warn('LayerBase: The subclass does not implemented the setStyle method')
  }

  // play all animations
  playAnimation() {
    this.sublayers.forEach(type => this.#backupAnimation[type]?.play())
  }
  
  /**
   * merge animation config
   * @param {*} options 
   */
  setAnimation(options) {
    merge(this.#backupAnimation, {options})
  }

  /**
   * color enhance function
   * @param {Number} count color number that we want
   * @param {Array} customColors custom colors will override theme colors
   * @returns correct colors
   */
  getColor(count, customColors) {
    const data = this.data?.data
    const {getColor} = this.options
    // the order attribute indicates the color priority
    const order = this.data?.options?.order
    // the legend layer uses the 'order'
    if (order) {
      const colorMapping = {}
      const {type, mapping} = order
      const colors = getColor(Math.max(...Object.values(mapping)) + 1, customColors)
      Object.keys(mapping).forEach(key => colorMapping[key] = colors[mapping[key]])
      // row & column has different vision
      const finalColors = type === 'column'
        ? data.slice(1).map(({header}) => colorMapping[header])
        : data[0].list.map(dimension => colorMapping[dimension])
      // auto fill
      return finalColors.length !== count ? new Array(count).fill(finalColors[0]) : finalColors
    }
    return this.options.getColor(count, customColors)
  }

  /**
   * merge scale for the whole layer
   * @param {Object} defaultScale
   * @param {Object} currentScale
   * @param {Object} incomingScale
   * @returns corrent scales
   */
  createScale(defaultScale, currentScale, incomingScale = {}) {
    const nice = merge(defaultScale?.nice, currentScale?.nice, incomingScale?.nice)
    const scale = {nice}
    // the naming of the scale is fixed
    scaleTypes.forEach(type => {
      // due to the axis layer control all the scale which from different layer
      // scales which generate by layer itself has lowest priority
      scale[type] = incomingScale[type] || currentScale[type] || defaultScale[type]
      // the brush changed the range of current scale that need to be remembered
      if (currentScale[type]?.brushed) {
        scale[type].range(currentScale[type].range())
        scale[type].brushed = currentScale[type].brushed
      }
    })
    return scale
  }

  /**
   * merge style for the whole layer
   * @param {Object} defaultStyle
   * @param {Object} currentStyle
   * @param {Object} incomingStyle
   * @returns correct styles
   */
  createStyle(defaultStyle, currentStyle, incomingStyle = {}) {
    const {baseFontSize} = this.options
    const style = merge({}, defaultStyle, currentStyle, incomingStyle)
    const keys = Object.keys(incomingStyle)
    // multiply the baseFontSize (not save yet)
    keys.forEach(key => {
      if (key.search(/text/i) !== -1 && style[key].fontSize) {
        style[key].fontSize *= baseFontSize
      }
    })
    return style
  }

  /**
   * handle texts in the wave
   * @param {Object} options schema
   * @returns text data
   */
  createText({x, y, value, style, position = positionType.RIGHTTOP, offset = 0}) {
    let [positionX, positionY] = [x, y]
    const {fontSize = 12, writingMode, format} = style
    const formattedText = String(formatNumber(value, format))
    const textWidth = getTextWidth(formattedText, fontSize)
    if (position === positionType.CENTER) {
      positionX -= textWidth / 2
      positionY += fontSize / 2
    } else if (position === positionType.LEFT) {
      positionX -= textWidth + offset
      positionY += fontSize / 2
    } else if (position === positionType.RIGHT) {
      positionX += offset
      positionY += fontSize / 2
    } else if (position === positionType.TOP) {
      positionX -= textWidth / 2
      positionY -= offset
    } else if (position === positionType.BOTTOM) {
      positionX -= textWidth / 2
      positionY += fontSize + offset
    } else if (position === positionType.LEFTTOP) {
      positionX -= textWidth
    } else if (position === positionType.LEFTBOTTOM) {
      positionX -= textWidth
      positionY += fontSize
    } else if (position === positionType.RIGHTBOTTOM) {
      positionY += fontSize
    }
    // relocate position according to the 'writingMode'
    // but still has a problem: font height
    if (writingMode === 'vertical') {
      positionX += textWidth / 2
      positionY += -fontSize
    }
    // offset fix
    if (isArray(style.offset)) {
      positionX += style.offset[0]
      positionY -= style.offset[1]
    }
    return {
      x: positionX,
      y: positionY,
      value: formattedText, 
      transformOrigin: `${positionX}px ${positionY}px`,
      textWidth,
    }
  }

  // initialize mouse event
  #createEvent = () => {
    const {tooltip} = this.options
    this.#backupEvent = {
      common: {},
      // tooltip event
      tooltip: {
        mouseover: (event, data) => tooltip.update({data, backup: this.#backupData}).show().move(event),
        mousemove: event => tooltip.move(event),
        mouseout: () => tooltip.hide(),
      },
    }
    // basic mouse event
    commonEvents.forEach(eventType => {
      this.#backupEvent.common[eventType] = {}
      const events = this.#backupEvent.common[eventType]
      this.sublayers.forEach(sublayer => {
        events[sublayer] = (event, data) => this.event.fire(`${eventType}-${sublayer}`, {event, data})
      })
    })
  }

  /**
   * set visible for the layer
   * @param {Boolean} isVisiable
   * @param {String} sublayer
   */
  setVisible(visible, sublayer) {
    const {selector} = this
    const className = `${this.className}-${sublayer}`
    const target = sublayer ? selector.getFirstChildByClassName(this.root, className) : this.root
    selector.setVisible(target, visible)
  }

  // register the response events after render
  #setEvent = sublayer => {
    const {engine} = this.selector
    if (engine === 'svg') {
      const els = this.root.selectAll(`.wave-basic-${sublayer}`).style('cursor', 'pointer')
      commonEvents.forEach(eventType => els.on(`${eventType}.common`, this.#backupEvent.common[eventType][sublayer]))
    }
  }

  // register the tooltip events after render
  #setTooltip = sublayer => {
    const {engine} = this.selector
    if (engine === 'svg' && this.tooltipTargets.find(key => key === sublayer)) {
      const els = this.root.selectAll(`.wave-basic-${sublayer}`)
      tooltipEvents.forEach(eventType => els.on(`${eventType}.tooltip`, this.#backupEvent.tooltip[eventType]))
    }
  }

  // register the animation events after render
  #setAnimation = sublayer => {
    let isFirstPlay = true
    const {options} = this.#backupAnimation
    // destroy previous animation to free resource
    if (this.#backupAnimation[sublayer]) {
      this.#backupAnimation[sublayer].destroy()
      isFirstPlay = false
    }
    // no data & config
    if (this.#backupData[sublayer].length === 0 || !options || !options[sublayer]) {
      this.#backupAnimation[sublayer] = null
      return
    }
    const animationQueue = new Animation.Queue({loop: false})
    const enterQueue = new Animation.Queue({loop: false})
    const loopQueue = new Animation.Queue({loop: true})
    const {enter, loop, update} = options[sublayer]
    const targets = `.wave-basic-${sublayer}`
    // create enter & loop animation and connect them
    isFirstPlay && animationQueue.push('queue', enterQueue)
    isFirstPlay && enter && enterQueue.push(enter.type, {...enter, targets}, this.root)
    loop && loopQueue.push(loop.type, {...loop, targets}, this.root)
    this.#backupAnimation[sublayer] = animationQueue.push('queue', loopQueue)
    // register the animation events
    this.#backupAnimation[sublayer].event.on('start', d => this.event.fire(`${sublayer}-animation-start`, d))
    this.#backupAnimation[sublayer].event.on('process', d => this.event.fire(`${sublayer}-animation-process`, d))
    this.#backupAnimation[sublayer].event.on('end', d => this.event.fire(`${sublayer}-animation-end`, d))
    // restart the loop animation after the update animation
    if (!isFirstPlay) {
      clearTimeout(this.#backupAnimation[sublayer].timer)
      const {duration = 2000, delay = 0} = update || {}
      const timer = setTimeout(() => this.#backupAnimation[sublayer].play(), duration + delay)
      this.#backupAnimation[sublayer].timer = timer
    }
  }

  /**
   * universal draw function
   * @param {String} type element type
   * @param {Array<Object>} data sublayer data
   * @param {String} sublayer
   */
  drawBasic = (type, data, sublayer = type) => {
    const {selector} = this
    const {engine} = selector
    // layer container preparation
    if (!this.root) {
      this.root = selector.createSubContainer(this.options.root)
      selector.setClassName(this.root, this.className)
    }
    // sublayer container preparation
    const sublayerClassName = `${this.className}-${sublayer}`
    let sublayerContainer = selector.getFirstChildByClassName(this.root, sublayerClassName)
    if (!sublayerContainer) {
      sublayerContainer = selector.createSubContainer(this.root)
      selector.setClassName(sublayerContainer, sublayerClassName)
    }
    // group container preparation: delete the redundant group in the last rendering
    for (let i = 0; i < Math.max(this.#backupData[sublayer].length, data.length); i++) {
      const groupClassName = `${sublayerClassName}-${i}`
      let groupContainer = selector.getFirstChildByClassName(sublayerContainer, groupClassName)
      if (i < data.length && !groupContainer) {
        groupContainer = selector.createSubContainer(sublayerContainer)
        selector.setClassName(groupContainer, groupClassName)
      } else if (i >= data.length) {
        selector.remove(groupContainer)
      }
    }
    // start analysis data
    for (let i = 0; i < data.length; i++) {
      this.#backupData[sublayer].length = data.length
      if (!isEqual(this.#backupData[sublayer][i], data[i])) {
        const groupClassName = `${sublayerClassName}-${i}`
        const groupContainer = selector.getFirstChildByClassName(sublayerContainer, groupClassName)
        const options = {...data[i], engine, className: `wave-basic-${sublayer}`, container: groupContainer}
        // first play will close the update animation
        options.enableUpdateAnimation = false
        if (this.#backupData[sublayer][i] && this.#backupAnimation.options[sublayer]) {
          const {duration, delay} = this.#backupAnimation.options[sublayer].update || {}
          options.enableUpdateAnimation = true
          options.updateAnimationDuration = duration
          options.updateAnimationDelay = delay
        }
        // draw basic elements using draw functions
        !options.hide && basicMapping[type](options)
        // backup data
        this.#backupData[sublayer][i] = data[i]
      }
    }
    // new elements need to register events
    if (this.selector.engine === 'svg') {
      this.#setEvent(sublayer)
      this.#setAnimation(sublayer)
      this.#setTooltip(sublayer)
    }
  }

  // destroy the layer
  destroy() {
    this.sublayers.forEach(name => this.#backupAnimation[name]?.destroy())
    this.selector.remove(this.root)
    this.event.fire('destroy')
  }
}
