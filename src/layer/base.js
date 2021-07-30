import {isArray, isEqual, merge} from 'lodash'
import Animation from '../animation'
import formatText from '../util/format-text'
import getTextWidth from '../util/text-width'
import createEvent from '../util/create-event'
import basicMapping from '../draw'

// 文字基于坐标的方向
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

// 其他常量
export const scaleTypes = ['scaleX', 'scaleY', 'scaleYR', 'scaleAngle', 'scaleRadius']
export const commonEvents = ['click', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'mousedown', 'dblclick']
export const tooltipEvents = ['mouseover', 'mouseout', 'mousemove']

export default class LayerBase {
  #backupData = {}

  #backupEvent = {}

  #backupAnimation = {}

  constructor(layerOptions, waveOptions, subLayers) {
    this.options = merge(layerOptions, waveOptions)
    this.subLayers = subLayers || []
    this.tooltipTargets = []
    this.root = null
    this.className = null
    this.#createEvent()
    this.event = createEvent(__filename)
    this.warn = (text, data) => this.options.warn(text, data)
    this.subLayers.forEach(name => this.#backupData[name] = [])
    this.playAnimation = () => this.subLayers.forEach(type => this.#backupAnimation[type]?.play())
  }

  /**
   * 颜色增强函数
   * @param {Number} count 数量
   * @param {Array} customColors 自定义颜色覆盖主题色
   * @returns 正确的颜色
   */
  getColor(count, customColors) {
    const data = this.data?.data
    const order = this.data?.options?.order
    const {getColor} = this.options
    // 判断列表内有无颜色相关的属性，目前图例有用到
    if (order) {
      const colorMapping = {}
      const {type, mapping} = order
      const colors = getColor(Math.max(...Object.values(mapping)) + 1, customColors)
      Object.keys(mapping).forEach(key => colorMapping[key] = colors[mapping[key]])
      const finalColors = type === 'column'
        ? data.slice(1).map(({header}) => colorMapping[header])
        : data[0].list.map(dimension => colorMapping[dimension])
      return finalColors.length !== count ? new Array(count).fill(finalColors[0]) : finalColors
    }
    return this.options.getColor(count, customColors)
  }

  /**
   * 返回统一处理后的比例尺
   * @param {Object} defaultScale 默认比例尺，由数据计算而来
   * @param {Object} currentScale 当前比例尺
   * @param {Object} incomingStyle 传入比例尺
   * @returns 
   */
  createScale(defaultScale, currentScale, incomingStyle) {
    const nice = merge(defaultScale?.nice, currentScale?.nice, incomingStyle?.nice)
    const scale = {nice}
    // 比例尺的命名是固定不变的
    scaleTypes.forEach(type => {
      // 由于目前的比例尺策略是由坐标轴统一控制，所以图层数据计算的比例尺优先级最低
      scale[type] = incomingStyle[type] || defaultScale[type] || currentScale[type]
      // 笔刷更改了当前比例尺的值域，这个值域需要继承
      if (currentScale[type]?.brushed) {
        scale[type].range(currentScale[type].range())
        scale[type].brushed = currentScale[type].brushed
      }
    })
    return scale
  }

  /**
   * 返回统一处理后的样式
   * @param {Object} defaultStyle 默认样式
   * @param {Object} currentStyle 当前样式
   * @param {Object} incomingStyle 传入样式
   * @returns 新的样式
   */
  createStyle(defaultStyle, currentStyle, incomingStyle) {
    const {baseFontSize} = this.options
    const style = merge({}, defaultStyle, currentStyle, incomingStyle)
    const keys = Object.keys(style)
    // 统一缩放字号
    keys.forEach(key => {
      if (key.search(/text/i) !== -1 && style[key].fontSize) {
        style[key].fontSize *= baseFontSize
      }
    })
    return style
  }

  /**
   * 返回统一处理后的标签数据
   * @param {Object} 计算文字需要的一些值
   * @returns 文字数据，包含坐标和值
   */
  createText({x, y, value, style, position = positionType.RIGHTTOP, offset = 0, textAnchor = 'start'}) {
    let [positionX, positionY] = [x, y]
    const {fontSize = 12, writingMode, format} = style
    const formattedText = formatText(value, format)
    const textWidth = getTextWidth(formattedText, fontSize)
    const autoOffset = isArray(offset) ? 0 : offset
    if (position === positionType.CENTER) {
      positionX -= textWidth / 2
      positionY += fontSize / 2
    } else if (position === positionType.LEFT) {
      positionX -= textWidth + autoOffset
      positionY += fontSize / 2
    } else if (position === positionType.RIGHT) {
      positionX += autoOffset
      positionY += fontSize / 2
    } else if (position === positionType.TOP) {
      positionX -= textWidth / 2
      positionY -= autoOffset
    } else if (position === positionType.BOTTOM) {
      positionX -= textWidth / 2
      positionY += fontSize + autoOffset
    } else if (position === positionType.LEFTTOP) {
      positionX -= textWidth
    } else if (position === positionType.LEFTBOTTOM) {
      positionX -= textWidth
      positionY += fontSize
    } else if (position === positionType.RIGHTBOTTOM) {
      positionY += fontSize
    }
    // 根据文字书写方向重定向位置，仍然有字体高度问题
    if (writingMode === 'vertical') {
      positionX += textWidth / 2
      positionY += textAnchor === 'end' ? fontSize : -fontSize
    }
    // 偏移控制
    if (isArray(style.offset)) {
      positionX += style.offset[0]
      positionY -= style.offset[1]
    }
    return {
      textAnchor,
      x: positionX,
      y: positionY,
      value: formattedText, 
      transformOrigin: `${positionX} ${positionY}`,
    }
  }

  // 初始化基础事件
  #createEvent = () => {
    const {tooltip} = this.options
    this.#backupEvent = {
      common: {},
      tooltip: {
        mouseover: (event, data) => tooltip.update({data, backup: this.#backupData}).show().move(event),
        mousemove: event => tooltip.move(event),
        mouseout: () => tooltip.hide(),
      },
    }
    // 基础鼠标事件
    commonEvents.forEach(eventType => {
      this.#backupEvent.common[eventType] = {}
      const events = this.#backupEvent.common[eventType]
      this.subLayers.forEach(subLayer => {
        events[subLayer] = (event, data) => this.event.fire(`${eventType}-${subLayer}`, {event, data})
      })
    })
  }

  // 元素渲染后进行配置
  setEvent = subLayer => {
    setTimeout(() => {
      const els = this.root.selectAll(`.wave-basic-${subLayer}`).style('cursor', 'pointer')
      commonEvents.forEach(eventType => els.on(`${eventType}.common`, this.#backupEvent.common[eventType][subLayer]))
    }, 0)
  }

  // 元素渲染后进行配置
  setTooltip() {
    this.tooltipTargets.forEach(subLayer => setTimeout(() => {
      const els = this.root.selectAll(`.wave-basic-${subLayer}`)
      tooltipEvents.forEach(eventType => els.on(`${eventType}.tooltip`, this.#backupEvent.tooltip[eventType]))
    }, 0))
  }

  /**
   * 控制整个图层的显示和隐藏
   * @param {Boolean} isVisiable 隐藏参数
   * @param {String} subLayer 元素类型可缺省
   */
  setVisible(isVisiable, subLayer) {
    const targets = subLayer ? this.root.selectAll(`.${this.className}-${subLayer}`) : this.root
    targets.style('display', isVisiable ? 'block' : 'none')
  }

  /**
   * 配置动画
   * @param {Object} options 以元素类型为 key 的动画描述对象
   * @returns 启动全部动画队列的函数
   */
  setAnimation(options) {
    setTimeout(() => {
      // 配置动画前先销毁之前的动画，释放资源
      this.subLayers.forEach(name => {
        this.#backupAnimation[name] && this.#backupAnimation[name].destroy()
        this.#backupAnimation[name] = null
      })
      // 为每种元素支持的每种动画配置
      this.subLayers.forEach(name => {
        // 没有数据，不需要配置动画
        if (this.#backupData[name].length === 0 || !options || !options[name]) {
          this.#backupAnimation[name] = null
          return
        }
        const animationQueue = new Animation.Queue({loop: false})
        const enterQueue = new Animation.Queue({loop: false})
        const loopQueue = new Animation.Queue({loop: true})
        const {enterAnimation, loopAnimation} = options[name]
        const targets = `.wave-basic-${name}`
        // 配置入场动画和轮播动画并连接
        enterAnimation && enterQueue.push(enterAnimation.type, {...enterAnimation, targets}, this.root)
        loopAnimation && loopQueue.push(loopAnimation.type, {...loopAnimation, targets}, this.root)
        this.#backupAnimation[name] = animationQueue.push('queue', enterQueue).push('queue', loopQueue)
        // 动画事件注册
        this.#backupAnimation[name].event.on('start', data => this.event.fire(`${name}-animation-start`, data))
        this.#backupAnimation[name].event.on('process', data => this.event.fire(`${name}-animation-process`, data))
        this.#backupAnimation[name].event.on('end', data => this.event.fire(`${name}-animation-end`, data))
      })
    }, 0)
  }

  /**
   * 统一的 draw 函数
   * @param {String} type 元素类型
   * @param {Array<Object>} data 图层元素数据
   * @param {String} subLayer 元素对应的 option 字段
   */
  drawBasic(type, data, subLayer = type) {
    // 图层容器准备
    this.root = this.root || this.options.root.append('g').attr('class', this.className)
    // 元素容器准备，没有则追加
    const containerClassName = `${this.className}-${subLayer}`
    let container = this.root.selectAll(`.${containerClassName}`)
    if (container.size() === 0) {
      container = this.root.append('g').attr('class', `${this.className}-${subLayer}`)
    }
    // 分组容器准备，删除上一次渲染多余的组
    for (let i = 0; i < Math.max(this.#backupData[subLayer].length, data.length); i++) {
      const groupClassName = `${containerClassName}-${i}`
      const els = container.selectAll(`.${groupClassName}`)
      if (i < data.length && els._groups[0].length === 0) {
        container.append('g').attr('class', groupClassName)
      } else if (i >= data.length) {
        els.remove()
      }
    }
    // 根据对应列表数据绘制最终的元素
    for (let i = 0; i < data.length; i++) {
      this.#backupData[subLayer].length = data.length
      if (!isEqual(this.#backupData[subLayer][i], data[i])) {
        const groupClassName = `${containerClassName}-${i}`
        const elContainer = container.selectAll(`.${groupClassName}`)
        const options = {...data[i], className: `wave-basic-${subLayer}`, container: elContainer}
        // 首次渲染不启用数据更新动画
        options.enableUpdateAnimation = this.#backupData[subLayer][i] ? data[i].enableUpdateAnimation : false
        // 调用基础元素绘制函数进行绘制
        !options.hide && basicMapping[type](options)
        // 备份数据以便支持其他功能
        this.#backupData[subLayer][i] = data[i]
      }
    }
    // 新的元素需要重新注册事件
    this.setEvent(subLayer)
    this.setTooltip({rebind: true})
  }

  // 销毁图层
  destroy() {
    this.subLayers.forEach(name => this.#backupAnimation[name]?.destroy())
    this.root.remove()
    this.event.fire('destroy')
  }
}
