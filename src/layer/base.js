import chroma from 'chroma-js'
import {cloneDeep, isArray, isEqual, merge} from 'lodash'
import Animation from '../animation'
import {dataMapping} from '../data'
import basicMapping from '../draw'
import createEvent from '../utils/create-event'
import createLog from '../utils/create-log'
import {formatNumber} from '../utils/format'
import Selector from '../utils/selector'
import getTextWidth from '../utils/text-width'
import ColorMatrix from '../utils/color-matrix'
import {COMMON_EVENTS, LIFE_CYCLE, SCALE_TYPE, POSITION, TOOLTIP_EVENTS} from '../utils/constants'

export default class LayerBase {
  #backupData = {}

  #backupEvent = {}

  #backupAnimation = {options: {}}

  constructor(layerOptions, chartOptions, sublayers) {
    this.options = merge(layerOptions, chartOptions)
    this.sublayers = sublayers || []
    this.tooltipTargets = []
    this.root = null
    this.className = null
    this.#initializeEvent()
    this.log = createLog('src/layer/base')
    this.event = createEvent('src/layer/base')
    this.sublayers.forEach(name => (this.#backupData[name] = []))
    this.selector = new Selector(this.options.engine)
    this.#createLifeCycles()
  }

  // avoid repeated binding
  #initializeEvent = () => {
    const {tooltip, engine, tooltipOption = {visible: true}} = this.options
    this.#backupEvent = {
      common: {},
      tooltip: tooltipOption.visible && {
        mouseout: () => tooltip.hide(),
        mousemove: event => tooltip.move(engine === 'svg' ? event : event.e),
        mouseover: (event, data) => {
          tooltip.update({backup: this.#backupData, data: engine === 'svg' ? data : event.target})
          tooltip.show(engine === 'svg' ? event : event.e)
        },
      },
    }
    // basic mouse event
    COMMON_EVENTS.forEach(type => {
      const events = {}
      this.#backupEvent.common[type] = events
      this.sublayers.forEach(sublayer => {
        events[sublayer] = (event, data) => {
          this.event.fire(`${type}-${sublayer}`, {
            data: engine === 'svg' ? data : event.target,
            event: engine === 'svg' ? event : event.e,
          })
        }
      })
    })
  }

  #createLifeCycles = () => {
    LIFE_CYCLE.forEach(name => {
      const instance = this
      const fn = instance[name] || (() => null)
      instance[name] = (...parameter) => {
        try {
          instance.event.fire(`before:${name}`, {...parameter})
          fn.call(instance, ...parameter)
          instance.event.fire(name, {...parameter})
        } catch (error) {
          this.log.error('Layer life cycle call exception', error)
        }
      }
    })
  }

  /**
   * update the layer
   * @param {String} id
   * @param {Object} schema layer config
   */
  update({data, scale, style, animation}) {
    if (animation !== undefined) {
      this.setAnimation(animation)
    }
    if (data !== undefined || scale !== undefined) {
      this.setData(data, scale)
    }
    if (data !== undefined || scale !== undefined || style !== undefined) {
      this.setStyle(style)
    }
    this.draw()
  }

  /**
   * color enhance function
   * @param {*} rowNumber
   * @param {*} columnNumber
   * @param {*} customColors custom colors will override theme colors
   * @returns color matrix
   */
  getColorMatrix(rowNumber, columnNumber, customColors, nice = true) {
    let colorMatrix = []
    let originColors = this.options.theme
    // not use theme colors
    if (customColors) {
      originColors = isArray(customColors) ? customColors : [customColors]
    }
    // the order attribute indicates the color priority
    const order = this.data?.options?.order
    // the order from legend layer
    if (order && order.colorMatrix) {
      const data = this.data?.data
      const {type, mapping} = order
      colorMatrix = cloneDeep(order.colorMatrix.matrix)
      // filter colors
      if (type === 'row') {
        const selected = data[0].list.map(dimension => mapping[dimension])
        selected.sort()
        colorMatrix = selected.map(index => colorMatrix[index])
      } else if (type === 'column') {
        const selected = data.slice(1).map(({header}) => mapping[header])
        selected.sort()
        colorMatrix = colorMatrix.map(row => selected.map(index => row[index]))
        // one column and multiple columns have different color picking methods
        if (selected.length === 1) {
          while (colorMatrix.length < data[0].list.length) {
            colorMatrix.push(colorMatrix[0])
          }
        }
      }
      return new ColorMatrix(colorMatrix)
    }
    // new color matrix
    if (columnNumber === 1) {
      colorMatrix = chroma
        .scale(originColors)
        .mode('lch')
        .colors(rowNumber)
        .map(color => [color])
    } else {
      const rowColors = chroma
        .scale(originColors)
        .mode('lch')
        .colors(rowNumber + 1)
      // unfold: 1 dimension => 2 dimensions
      rowColors.reduce((prevColor, curColor, index) => {
        const count = index === rowNumber ? columnNumber : columnNumber + 1
        colorMatrix.push(chroma.scale([prevColor, curColor]).mode('lch').colors(count))
        return curColor
      })
    }
    // nice matrix automatically
    const matrix = new ColorMatrix(colorMatrix)
    nice && !customColors && matrix.nice()
    return matrix
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
    SCALE_TYPE.forEach(type => {
      // Due to the axis layer control all the scale which from different layer.
      // Scales which generate by layer itself has lowest priority.
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
   * check data for layer
   * @param {String} dataType
   * @param {*} currentData
   * @param {*} incomingData
   * @param {Function} filter data handler
   * @returns is the data correct or not
   */
  createData(dataType, currentData, incomingData, filter) {
    if (!incomingData) {
      return currentData
    }
    if (!(incomingData instanceof dataMapping[dataType])) {
      throw new Error('Require the right data processor')
    }
    return filter ? filter(incomingData) : incomingData
  }

  /**
   * merge style for the whole layer
   * @param {Object} defaultStyle
   * @param {Object} currentStyle
   * @param {Object} incomingStyle
   * @returns correct styles
   */
  createStyle(defaultStyle, currentStyle, incomingStyle = {}) {
    const style = merge({}, defaultStyle, currentStyle, incomingStyle)
    return style
  }

  /**
   * handle texts in the chart
   * @param {Object} options schema
   * @returns text data
   */
  createText({x, y, value, style, position = POSITION.RIGHTTOP, offset = 0}) {
    let [positionX, positionY] = [x, y]
    const {fontSize = 12, writingMode, format} = style
    const formattedText = String(formatNumber(value, format))
    const textWidth = getTextWidth(formattedText, fontSize)
    if (position === POSITION.CENTER) {
      positionX -= textWidth / 2
      positionY += fontSize / 2
    } else if (position === POSITION.LEFT) {
      positionX -= textWidth + offset
      positionY += fontSize / 2
    } else if (position === POSITION.RIGHT) {
      positionX += offset
      positionY += fontSize / 2
    } else if (position === POSITION.TOP) {
      positionX -= textWidth / 2
      positionY -= offset
    } else if (position === POSITION.BOTTOM) {
      positionX -= textWidth / 2
      positionY += fontSize + offset
    } else if (position === POSITION.LEFTTOP) {
      positionX -= textWidth + offset
      positionY -= offset
    } else if (position === POSITION.RIGHTTOP) {
      positionX += offset
      positionY -= offset
    } else if (position === POSITION.LEFTBOTTOM) {
      positionX -= textWidth + offset
      positionY += fontSize + offset
    } else if (position === POSITION.RIGHTBOTTOM) {
      positionX += offset
      positionY += fontSize + offset
    }
    // Relocate position according to the 'writingMode'.
    // But still has a problem: font height
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
      transformOrigin: `${x}px ${y}px`,
      textWidth,
    }
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
  setEvent = sublayer => {
    const {engine} = this.selector
    if (engine === 'svg') {
      const els = this.root.selectAll(`.chart-basic-${sublayer}`).style('cursor', 'pointer')
      COMMON_EVENTS.forEach(type => els.on(`${type}.common`, this.#backupEvent.common[type][sublayer]))
    } else if (engine === 'canvas') {
      const els = this.root.getObjects().filter(({className}) => className === `chart-basic-${sublayer}`)
      COMMON_EVENTS.forEach(type => els.forEach(el => el.on(type, this.#backupEvent.common[type][sublayer])))
    }
  }

  // register the tooltip events after render
  setTooltip = sublayer => {
    const {engine} = this.selector
    if (this.tooltipTargets.indexOf(sublayer) !== -1) {
      if (engine === 'svg') {
        const els = this.root.selectAll(`.chart-basic-${sublayer}`)
        TOOLTIP_EVENTS.forEach(type => els.on(`${type}.tooltip`, this.#backupEvent.tooltip[type]))
      } else if (engine === 'canvas') {
        const els = this.root.getObjects().filter(({className}) => className === `chart-basic-${sublayer}`)
        TOOLTIP_EVENTS.forEach(type => els.forEach(el => el.on(type, this.#backupEvent.tooltip[type])))
      }
    }
  }

  setAnimation(options) {
    merge(this.#backupAnimation, {options})
  }

  playAnimation() {
    this.sublayers.forEach(type => this.#backupAnimation[type]?.play())
  }

  // register the animation events after render
  #createAnimation = sublayer => {
    let isFirstPlay = true
    const {engine} = this.options
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
    const targets = `.chart-basic-${sublayer}`
    // create enter & loop animation and connect them
    isFirstPlay && animationQueue.push('queue', enterQueue)
    isFirstPlay && enter && enterQueue.push(enter.type, {...enter, targets, engine}, this.root)
    loop && loopQueue.push(loop.type, {...loop, targets, engine}, this.root)
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
      this.root = selector.createSubContainer(this.options.root, this.className)
    }
    // sublayer container preparation
    const sublayerClassName = `${this.className}-${sublayer}`
    let sublayerContainer = selector.getFirstChildByClassName(this.root, sublayerClassName)
    if (!sublayerContainer) {
      sublayerContainer = selector.createSubContainer(this.root, sublayerClassName)
    }
    // group container preparation: delete the redundant group in the last rendering
    for (let i = 0; i < Math.max(this.#backupData[sublayer].length, data.length); i++) {
      const groupClassName = `${sublayerClassName}-${i}`
      let groupContainer = selector.getFirstChildByClassName(sublayerContainer, groupClassName)
      if (i < data.length && !groupContainer) {
        groupContainer = selector.createSubContainer(sublayerContainer, groupClassName)
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
        const options = {engine, className: `chart-basic-${sublayer}`, container: groupContainer}
        // filter
        !data[i].hide && merge(options, data[i])
        // first play will close the update animation
        options.enableUpdateAnimation = false
        if (this.#backupData[sublayer][i] && this.#backupAnimation.options[sublayer]) {
          const {duration, delay} = this.#backupAnimation.options[sublayer].update || {}
          options.enableUpdateAnimation = true
          options.updateAnimationDuration = duration
          options.updateAnimationDelay = delay
        }
        // draw basic elements using draw functions
        basicMapping[type](options)
        // backup data
        this.#backupData[sublayer][i] = data[i]
      }
    }
    // new elements need to register events
    this.setEvent(sublayer)
    this.setTooltip(sublayer)
    this.selector.engine === 'svg' && this.#createAnimation(sublayer)
  }

  destroy() {
    this.sublayers.forEach(name => this.#backupAnimation[name]?.destroy())
    this.selector.remove(this.root)
  }
}
