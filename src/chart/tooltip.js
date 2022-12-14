import {select} from 'd3'
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
  backgroundColor: '#c3c4c5',
}

export default class Tooltip {
  constructor(chartContainer, options) {
    this.backup = null
    this.target = null
    this.isMoving = false
    this.isVisible = false
    this.isAvailable = false
    this.log = createLog('src/chart/tooltip')
    this.options = merge({}, defaultOptions, options)
    this.lastPosition = {x: -100, y: -100}
    // root container
    const {container, backgroundColor} = this.options
    this.instance = ((container && select(container)) || chartContainer)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('border-radius', '2px')
      .style('position', 'absolute')
      .style('overflow', 'hidden')
      .style('display', 'none')
      .style('z-index', 999)
      .style('left', 0)
      .style('top', 0)
    // blurred background
    this.instance
      .append('div')
      .attr('class', 'chart-tooltip-bg')
      .style('filter', 'blur(1px)')
      .style('background-color', backgroundColor)
      .style('position', 'absolute')
      .style('width', '1000px')
      .style('height', '1000px')
  }

  show(event) {
    this.isVisible = true
    this.instance.style('display', 'block')
    event && this.move(event)
    return this
  }

  hide() {
    this.isVisible = false
    this.instance.style('display', 'none')
    return this
  }

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
        const group = backup[elType].filter(({source}) => isEqual(source[0].dimension, dimension))[0]
        const {source, fill, stroke} = group
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
        .selectAll('.chart-tooltip-title')
        .data([list[0].dimension])
        .join('div')
        .attr('class', 'chart-tooltip-title')
        .style('padding', '5px 5px 0')
        .style('font-size', `${titleSize}px`)
        .style('color', titleColor)
        .style('position', 'relative')
        .text(d => d)
      // content
      const container = this.instance
        .selectAll('.chart-tooltip-content')
        .data([null])
        .join('div')
        .attr('class', 'chart-tooltip-content')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('padding', '5px')
        .style('position', 'relative')
      // every row
      container.selectAll('div').remove()
      const rows = container
        .selectAll('div')
        .data(list)
        .join('div')
        .style('display', 'flex')
        .style('flex-direction', 'row')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
        .style('width', '160px')
      // point and text in row
      const pointWidthLabel = rows
        .append('div')
        .style('display', 'flex')
        .style('flex-direction', 'row')
        .style('justify-content', 'space-between')
        .style('align-items', 'center')
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

  move({offsetX, offsetY}) {
    const drift = 10
    const rect = this.instance.nodes()[0].getBoundingClientRect()
    // boundary judgement
    if (offsetX + rect.width > document.body.clientWidth) {
      offsetX -= rect.width + drift
    } else {
      offsetX += drift
    }
    if (offsetY + rect.height > document.body.clientHeight) {
      offsetY -= rect.height + drift
    } else {
      offsetY += drift
    }
    this.instance.style('left', `${offsetX}px`).style('top', `${offsetY}px`)
    this.lastPosition = {x: offsetX, y: offsetY}
    return this
  }

  destroy() {
    this.hide()
    this.backup = null
    this.isAvailable = false
    this.instance.remove()
  }
}
