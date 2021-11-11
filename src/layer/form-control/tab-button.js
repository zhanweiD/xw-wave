import * as d3 from 'd3'
import {merge} from 'lodash'
import {addStyle, transformAttr} from '../../utils/common'
import {DIRECTION} from '../../utils/constants'
import LayerBase from '../base'

const defaultStyle = {
  direction: DIRECTION.HORIZONTAL,
  active: {
    backgroundColor: 'rgb(0,119,255)',
  },
  inactive: {
    backgroundColor: 'rgb(255,255,255,.2)',
  },
  text: {
    fontSize: 12,
  },
}

export default class TabButtonLayer extends LayerBase {
  #data = []

  #tabData = []

  #style = defaultStyle

  get data() {
    return this.#data
  }

  get style() {
    return this.#style
  }

  constructor(layerOptions, chartOptions) {
    super(layerOptions, chartOptions)
    const {containerWidth, containerHeight, layout} = this.options
    const {left, top, width, height} = layout
    this.className = 'chart-tab-button'
    this.root = this.options.root
      .append('foreignObject')
      .style('width', containerWidth)
      .style('height', containerHeight)
      .append('xhtml:div')
      .attr('class', `${this.className}-container`)
      .style('width', `${width}px`)
      .style('height', `${height}px`)
      .style('margin-left', `${left}px`)
      .style('margin-top', `${top}px`)
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
  }

  setData(tableList) {
    this.#data = this.createData('tableList', this.#data, tableList)
    const headers = this.#data.data.map(({header}) => header)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    // basic tab data
    this.#tabData = pureTableList.map(item => ({
      isActive: false,
      text: item[0],
      source: headers.reduce((prev, cur, index) => {
        prev[cur] = item[index]
        return prev
      }, {}),
    }))
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {width, height} = this.options.layout
    const {text, active, inactive, direction} = this.#style
    const sizeData = {
      width: `${direction === DIRECTION.HORIZONTAL ? width / this.#tabData.length : width}px`,
      height: `${direction === DIRECTION.VERTICAL ? height / this.#tabData.length : height}px`,
    }
    this.#tabData.forEach(item => merge(item, sizeData, text, item.isActive ? active : inactive))
  }

  draw() {
    this.root
      .style('flex-direction', this.#style.direction === DIRECTION.VERTICAL ? 'column' : 'row')
      .selectAll(`.${this.className}-item`)
      .data(this.#tabData)
      .join('xhtml:div')
      .attr('class', `${this.className}-item`)
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('cursor', 'pointer')
      .each((data, index, items) => {
        const el = d3.select(items[index])
        const style = transformAttr(data)
        addStyle(el, style, index)
        el.text(style.text)
      })
      .on('click', (event, data) => {
        this.event.fire('click-tab', data.source)
        this.#tabData.forEach(item => (item.isActive = false))
        this.#tabData.find(({text}) => text === data.text).isActive = true
        this.setStyle()
        this.draw()
      })
  }
}
