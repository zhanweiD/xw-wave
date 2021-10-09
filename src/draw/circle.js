import {fabric} from 'fabric'
import {isArray} from 'lodash'
import {mergeAlpha, getAttr} from '../utils/common'

export default function drawCircle({
  engine = 'svg',
  fill = '#fff',
  stroke = '#fff',
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  source = [],
  data = [], // [[rx, ry]]
  position = [], // [[cx, cy]]
  container,
  className,
}) {
  const configuredData = data.map((size, i) => ({
    className,
    fill: getAttr(fill, i),
    stroke: getAttr(stroke, i),
    opacity: getAttr(opacity, i),
    fillOpacity: getAttr(fillOpacity, i),
    strokeOpacity: getAttr(strokeOpacity, i),
    strokeWidth: getAttr(strokeWidth, i),
    source: getAttr(source, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
    position: isArray(position) && isArray(position[0]) ? position[i] : position,
    cx: position[i][0],
    cy: position[i][1],
    rx: size[0],
    ry: size[1],
  }))
  if (engine === 'svg') {
    container
      .selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('ellipse')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('cx', d => d.cx)
      .attr('cy', d => d.cy)
      .attr('rx', d => d.rx)
      .attr('ry', d => d.ry)
      .attr('fill', d => d.fill)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => `${d.position[0]}px ${d.position[1]}px`)
  } else if (engine === 'canvas') {
    configuredData.forEach(config => {
      const ellipse = new fabric.Ellipse({
        className: config.className,
        rx: config.rx,
        ry: config.ry,
        left: config.cx - config.rx,
        top: config.cy - config.ry,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        source: config.source,
        selectable: false,
      })
      container.add(ellipse)
    })
  }
}
