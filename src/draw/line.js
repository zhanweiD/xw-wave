import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../utils/common'

export default function drawLine({
  engine = 'svg',
  stroke = '#fff',
  strokeWidth = 1,
  opacity = 1,
  strokeOpacity = 1,
  dasharray = '',
  enableUpdateAnimation = false,
  updateAnimationDuration = 1000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  source = [],
  data = [], // [[x1, y1, x2, y2]]
  container,
  className,
}) {
  const configuredData = data.map((points, i) => ({
    className,
    stroke: getAttr(stroke, i),
    opacity: getAttr(opacity, i),
    strokeOpacity: getAttr(strokeOpacity, i),
    strokeWidth: getAttr(strokeWidth, i),
    source: getAttr(source, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
    strokeDasharray: getAttr(dasharray, i),
    x1: points[0],
    y1: points[1],
    x2: points[2],
    y2: points[3],
  }))
  if (engine === 'svg') {
    container
      .selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('line')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('stroke-dasharray', d => d.strokeDasharray)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('opacity', d => d.opacity)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('pointer-events', 'none')
  } else if (engine === 'canvas') {
    configuredData.forEach(config => {
      const line = new fabric.Line([config.x1, config.y1, config.x2, config.y2], {
        className: config.className,
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeDashArray: String(config.strokeDasharray).split(' '),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        source: config.source,
        selectable: false,
      })
      container.add(line)
    })
  }
}
