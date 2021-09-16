import {isEqual, isArray, merge} from 'lodash'
import createLog from '../utils/create-log'

const modeType = {
  SINGLE: 'single',
  GOURP: 'group',
}

const defaultOptions = {
  mode: modeType.SINGLE,
  pointSize: 10,
  titleSize: 14,
  titleColor: '#383d41',
  labelSize: 12,
  labelColor: '#383d41',
  valueSize: 12,
  valueColor: '#383d41',
  enableAnimation: false,
  animationDuration: 500,
  animationDelay: 0,
}

export default class Tooltip {
  constructor(container, options) {
    this.backup = null
    this.target = null
    this.isMoving = false
    this.isVisible = false
    this.isAvailable = false
    this.log = createLog('src/wave/tooltip')
    this.options = merge({}, defaultOptions, options)
    this.lastPosition = {x: -100, y: -100}
    // root container
    this.instance = container
      .append('div')
      .attr('class', 'wave-tooltip')
      .style('border-radius', '2px')
      .style('position', 'fixed')
      .style('overflow', 'hidden')
      .style('display', 'none')
      .style('z-index', 999)
      .style('left', 0)
      .style('top', 0)
    // blurred background
    this.instance
      .append('div')
      .attr('class', 'wave-tooltip-bg')
      .style('filter', 'blur(1px)')
      .style('background-color', 'rgba(255,245,247,0.9)')
      .style('position', 'absolute')
      .style('width', '1000px')
      .style('height', '1000px')
  }

  show() {
    this.isVisible = true
    this.instance.style('display', 'block')
    return this
  }

  hide() {
    this.isVisible = false
    this.instance.style('display', 'none')
    return this
  }

  /**
   * create tooltip list from element's data
   * @param {Object} data
   * @param {Object} backup
   * @returns
   */
  #getListData = (data, backup) => {
    let list = null
    const {mode} = this.options
    if (mode === modeType.SINGLE) {
      const {fill, stroke, source} = data
      const pointColor = fill || stroke
      list = (isArray(source) ? source : [source]).map(item => ({pointColor, ...item}))
    }
    if (mode === modeType.GOURP) {
      try {
        const {dimension} = data.source
        const elType = data.className.split('-')[2]
        const groupData = backup[elType].filter(({source}) => isEqual(source[0].dimension, dimension))[0]
        const {source, fill, stroke} = groupData
        list = source.map((item, i) => ({...item, pointColor: isArray(fill) ? fill[i] : stroke[i]}))
      } catch (error) {
        this.log.warn('Tooltip: The layer does not support group mode', error)
      }
    }
    return list
  }

  update({data, backup}) {
    const list = this.#getListData(data, backup)
    const {titleSize, titleColor, pointSize, labelSize, labelColor, valueSize, valueColor} = this.options
    // render if and only if data change
    if (isArray(list) && !isEqual(this.backup, list)) {
      this.backup = list
      // dimension data
      this.instance
        .selectAll('.wave-tooltip-title')
        .data([list[0].dimension])
        .join('div')
        .attr('class', 'wave-tooltip-title')
        .style('padding', '5px 5px 0')
        .style('font-size', `${titleSize}px`)
        .style('color', titleColor)
        .style('position', 'relative')
        .text(d => d)
      // content
      const container = this.instance
        .selectAll('.wave-tooltip-content')
        .data([null])
        .join('div')
        .attr('class', 'wave-tooltip-content fbv fbjsb fbac')
        .style('padding', '5px')
        .style('position', 'relative')
      // every row
      container.selectAll('div').remove()
      const rows = container
        .selectAll('div')
        .data(list)
        .join('div')
        .attr('class', 'fbh fbjsb fbac')
        .style('width', '100%')
      // point and text in row
      const pointWidthLabel = rows
        .append('div')
        .attr('class', 'fbh fbjsb fbac')
        .style('margin-right', '20px')
      pointWidthLabel
        .append('div')
        .style('width', `${pointSize}px`)
        .style('height', `${pointSize}px`)
        .style('border-radius', '100%')
        .style('margin-right', '5px')
        .style('background-color', d => d.pointColor)
      pointWidthLabel
        .append('div')
        .style('font-size', `${labelSize}px`)
        .style('color', labelColor)
        .text(d => d.category)
      // value in row
      rows
        .append('div')
        .style('font-weight', 'bold')
        .style('font-size', `${valueSize}px`)
        .style('color', valueColor)
        .text(d => d.value)
    }
    return this
  }

  move({pageX, pageY}) {
    const drift = 10
    const rect = this.instance.nodes()[0].getBoundingClientRect()
    // boundary judgement
    if (pageX + rect.width > document.body.clientWidth) {
      pageX -= rect.width + drift
    } else {
      pageX += drift
    }
    if (pageY + rect.height > document.body.clientHeight) {
      pageY -= rect.height + drift
    } else {
      pageY += drift
    }
    this.instance.style('left', `${pageX}px`).style('top', `${pageY}px`)
    this.lastPosition = {x: pageX, y: pageY}
    return this
  }

  destroy() {
    this.hide()
    this.backup = null
    this.isAvailable = false
    this.instance.remove()
  }
}
