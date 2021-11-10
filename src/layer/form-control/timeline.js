import * as d3 from 'd3'
import {isArray} from 'lodash'
import {addStyle, transformAttr} from '../../utils/common'
import {overflowControl} from '../../utils/format'
import LayerBase from '../base'

const defaultStyle = {
  group: {},
  time: {},
  event: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    margin: '5px 0',
    padding: '15px 15px 15px 30px',
  },
  timeline: {
    circleSize: '10px',
    circleColor: 'skyblue',
    lineColor: 'skyblue',
    lineWidth: '1px',
  },
}

export default class TimelineLayer extends LayerBase {
  #data = []

  #sectionData = []

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
    this.className = 'wave-timeline'
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
      .style('overflow-x', 'hidden')
      .style('overflow-y', 'scroll')
      .style('flex-direction', 'column')
  }

  setData(tableList) {
    this.#data = this.createData('tableList', this.#data, tableList)
    const pureTableList = this.#data.transpose(this.#data.data.map(({list}) => list))
    this.#sectionData = pureTableList.map(([time, events]) => ({
      date: time && new Date(time).toLocaleDateString(),
      time: time && new Date(time).toLocaleTimeString('chinese', {hour12: false}),
      events: isArray(events) ? events : [events],
    }))
  }

  setStyle(style) {
    this.#style = this.createStyle(defaultStyle, this.#style, style)
  }

  draw() {
    const {width} = this.options.layout
    const {group, time, timeline, event} = this.#style
    this.root
      .selectAll(`.${this.className}-group`)
      .data(this.#sectionData)
      .join('xhtml:div')
      .attr('class', `${this.className}-group`)
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .style('justify-content', 'space-between')
      .style('width', `${width}px`)
      .each((groupData, index, groups) => {
        const groupEl = d3.select(groups[index])
        const groupStyle = transformAttr(group)
        addStyle(groupEl, groupStyle, index)
        groupEl
          .selectAll(`.${this.className}-time`)
          .data([null])
          .join('xhtml:div')
          .attr('class', `${this.className}-time`)
          .style('flex', 3)
          .style('display', 'grid')
          .style('place-items', 'center')
          .each((d, i, els) => addStyle(d3.select(els[i]), transformAttr(time)))
          .selectAll(`.${this.className}-time-text`)
          .data([groupData.date, groupData.time])
          .join('xhtml:div')
          .attr('class', `${this.className}-time-text`)
          .text(d => d)
        groupEl
          .selectAll(`.${this.className}-line`)
          .data([null])
          .join('xhtml:div')
          .attr('class', `${this.className}-line`)
          .style('flex', 1)
          .style('display', 'grid')
          .style('place-items', 'center')
          .style('position', 'relative')
          .each((d, i, els) => {
            const {circleSize, circleColor, lineWidth, lineColor} = timeline
            d3.select(els[i])
              .append('xhtml:div')
              .style('position', 'absolute')
              .style('width', 0)
              .style('height', index === 0 || index === groups.length - 1 ? '50%' : '100%')
              .style('top', index === 0 ? '50%' : 0)
              .style('border', `solid ${lineColor} ${lineWidth}`)
            d3.select(els[i])
              .append('xhtml:div')
              .style('width', circleSize)
              .style('height', circleSize)
              .style('background', circleColor)
              .style('position', 'absolute')
              .style('border-radius', '100%')
          })
        groupEl
          .selectAll(`.${this.className}-event`)
          .data([null])
          .join('xhtml:div')
          .attr('class', `${this.className}-event`)
          .style('flex', 6)
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('justify-content', 'center')
          .each((d, i, els) => addStyle(d3.select(els[i]), transformAttr(event)))
          .selectAll(`.${this.className}-event-text`)
          .data(groupData.events)
          .join('xhtml:div')
          .attr('class', `${this.className}-event-text`)
          .attr('title', d => d)
          .text((d, i, els) => {
            return overflowControl(d, {
              width: parseFloat(d3.select(els[i]).style('width')),
              fontSize: parseFloat(d3.select(els[i]).style('font-size')),
            })
          })
      })
  }
}
