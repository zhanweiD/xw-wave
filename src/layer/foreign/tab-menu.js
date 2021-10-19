import * as d3 from 'd3'
import {cloneDeep, max, merge} from 'lodash'
import {addStyle, getAttr, range, transformAttr} from '../../utils/common'
import LayerBase from '../base'

const directionType = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

const defaultStyle = {
  direction: directionType.HORIZONTAL,
  active: {
    backgroundColor: 'rgb(0,119,255)',
  },
  inactive: {
    backgroundColor: 'rgb(255,255,255,.2)',
  },
  text: {
    fontSize: 12,
  },
  group: {
    alignContent: 'start',
  },
}

export default class TabButtonLayer extends LayerBase {
  #data = {name: 'root', children: []}

  #activeNodes = []

  #originTabData = []

  #activeTabData = []

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
    this.className = 'wave-tab-menu'
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
  }

  // data is 2-dimensional array of object
  setData(data) {
    this.#data = data || this.#data
    const tree = d3
      .hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value)
    const nodes = tree.descendants()
    const maxDepth = max(nodes.map(({depth}) => depth))
    // the root is not visible
    this.#originTabData = range(1, maxDepth, 1).map(depth => nodes.filter(node => node.depth === depth))
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
    const {width, height} = this.options.layout
    const {text, active, inactive} = this.#style
    // filter nodes
    this.#activeTabData = this.#originTabData.slice(0, 1)
    for (let i = 0; i < this.#originTabData.length - 1; i++) {
      // current level has active node
      if (this.#activeNodes.length > i) {
        this.#activeTabData[i + 1] = this.#activeNodes[i].children
      }
    }
    // create drawable data
    this.#activeTabData = this.#activeTabData.map((group, i) => {
      const textStyle = cloneDeep(text)
      Object.entries(textStyle).forEach(([key, value]) => (textStyle[key] = getAttr(value, i)))
      return group.map(item => ({
        node: item,
        text: item.data.name,
        width: width / this.#originTabData.length,
        height: height / group.length,
        ...merge(textStyle, item.data.style, item.isActive ? active : inactive),
      }))
    })
  }

  draw() {
    const {group} = this.#style
    // texts
    this.root
      .selectAll(`.${this.className}-group`)
      .data(this.#activeTabData)
      .join('xhtml:div')
      .attr('class', `${this.className}-group`)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('overflow', 'scroll')
      .each((groupData, groupIndex, groups) => {
        const groupEl = d3.select(groups[groupIndex])
        const groupStyle = transformAttr(group)
        addStyle(groupEl, groupStyle, groupIndex)
        groupEl
          .selectAll(`.${this.className}-item`)
          .data(groupData)
          .join('xhtml:div')
          .attr('class', `${this.className}-item`)
          .style('display', 'grid')
          .style('place-items', 'center')
          .style('width', d => `${d.width}px`)
          .style('height', d => `${d.height}px`)
          .style('cursor', 'pointer')
          .each((itemData, itemIndex, items) => {
            const itemEl = d3.select(items[itemIndex])
            const itemStyle = transformAttr(itemData)
            addStyle(itemEl, itemStyle)
            itemEl.text(itemStyle.text)
          })
          .on('click', (event, data) => {
            const {node} = data
            const {depth} = node
            this.event.fire('click-tab', data)
            this.#activeNodes.length = depth
            this.#activeNodes[depth - 1] = node
            // set active
            node.parent
              .descendants()
              .filter(child => child.depth >= depth)
              .forEach(child => (child.isActive = false))
            node.isActive = true
            this.setStyle()
            this.draw()
          })
      })
  }
}
