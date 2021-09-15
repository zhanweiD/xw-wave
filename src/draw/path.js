import {isArray} from 'lodash'
import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../utils/common'

// draw a group of path
export default function drawPath({
  engine = 'svg',
  fill = '#fff',
  stroke = '#fff',
  strokeWidth = 1,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  transformOrigin = null,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  source = [],
  data = [], // array of string
  position = [0, 0], // offset position
  container,
  className,
}) {
  const configuredData = data.map((path, i) => ({
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
    transformOrigin: getAttr(transformOrigin, i),
    position: isArray(position) && isArray(position[0]) ? position[i] : position,
    path,
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('path')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('d', d => d.path)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => d.transformOrigin)
      .style('transform', d => `translate(${d.position[0]}px,${d.position[1]}px)`)
  }
  if (engine === 'canvas') {
    configuredData.forEach(config => {
      const path = new fabric.Path(config.path, {
        className: config.className,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        source: config.source,
        selectable: false,
      })
      path.left += config.position[0]
      path.top += config.position[1]
      container.add(path)
    })
  }
}
