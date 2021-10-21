import * as d3 from 'd3'
import {cloneDeep, merge} from 'lodash'
import {addStyle, getAttr, transformAttr} from '../../utils/common'
import LayerBase from '../base'

const iconPositionType = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
}

const defaultStyle = {
  iconPosition: iconPositionType.LEFT,
  icon: {
    src: null,
    width: 0,
    height: 0,
    padding: '10px',
  },
  text: {
    fontSize: 12,
  },
  group: {
    justifyContent: 'start',
    alignItems: 'center',
  },
}

export default class IndicatorLayer extends LayerBase {
  #data = [[]]

  #textContainer = null

  #iconContainer = null

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, waveOptions) {
    super(layerOptions, waveOptions)
    const {containerWidth, containerHeight, layout} = this.options
    const {left, top, width, height} = layout
    this.className = 'wave-indicator'
    this.root = this.options.root
      .append('foreignObject')
      .style('width', containerWidth)
      .style('height', containerHeight)
      .append('xhtml:div')
      .attr('class', `${this.className}-conatiner`)
      .style('width', `${width}px`)
      .style('height', `${height}px`)
      .style('margin-left', `${left}px`)
      .style('margin-top', `${top}px`)
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
    this.#textContainer = this.root
      .append('xhtml:div')
      .style('flex-direction', 'column')
      .style('justify-content', 'center')
      .style('align-items', 'center')
    this.#iconContainer = this.root.append('xhtml:img')
  }

  // data is 2-dimensional array of object
  setData(data) {
    if (!Array.isArray(data)) {
      data = [[data]]
    } else if (data.length === 0) {
      data = [[]]
    } else {
      data = data.map(item => (Array.isArray(item) ? item : [item]))
    }
    // initialize text data
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (typeof data[i][j] !== 'object') {
          data[i][j] = {text: `${data[i][j]}`}
        }
      }
    }
    // merge data
    merge(this.#data, data)
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {text} = this.#style
    // merge style
    for (let i = 0; i < this.#data.length; i++) {
      const group = this.#data[i]
      const textStyle = cloneDeep(text)
      Object.entries(textStyle).forEach(([key, value]) => (textStyle[key] = getAttr(value, i)))
      for (let j = 0; j < group.length; j++) {
        group[j] = merge({}, textStyle, group[j])
      }
    }
  }

  draw() {
    const {group, icon, iconPosition} = this.#style
    // modify icon position
    if (iconPosition === iconPositionType.TOP || iconPosition === iconPositionType.BOTTOM) {
      this.root.style('flex-direction', 'column')
    }
    if (iconPosition === iconPositionType.LEFT || iconPosition === iconPositionType.TOP) {
      const root = this.root.nodes()[0]
      const iconContainer = this.#iconContainer.nodes()[0]
      const textContainer = this.#textContainer.nodes()[0]
      root.replaceChild(iconContainer, textContainer)
      root.append(textContainer)
    }
    // icon
    if (icon.src) {
      const style = transformAttr(icon)
      const {src, width, height} = style
      this.#iconContainer.attr('src', src).attr('width', width).attr('height', height)
      addStyle(this.#iconContainer, style)
    }
    // texts
    this.#textContainer
      .selectAll(`.${this.className}-group`)
      .data(this.#data)
      .join('xhtml:div')
      .attr('class', `${this.className}-group`)
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .each((groupData, groupIndex, groups) => {
        const groupEl = d3.select(groups[groupIndex])
        const groupStyle = transformAttr(group)
        addStyle(groupEl, groupStyle, groupIndex)
        groupEl
          .selectAll(`.${this.className}-item`)
          .data(groupData)
          .join('xhtml:div')
          .attr('class', `${this.className}-item`)
          .each((itemData, itemIndex, items) => {
            const itemEl = d3.select(items[itemIndex])
            const itemStyle = transformAttr(itemData)
            addStyle(itemEl, itemStyle)
            itemEl.text(itemStyle.text)
          })
      })
  }
}
