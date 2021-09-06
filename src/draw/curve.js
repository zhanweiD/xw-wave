import * as d3 from 'd3'
import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../util/common'

// draw a group of curve
export default function drawCurve({
  engine = 'svg',
  stroke = '#fff',
  opacity = 1,
  strokeOpacity = 1,
  strokeWidth = 1,
  curve = false,
  dasharray = '',
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item,
  mask = null,
  filter = null,
  source = [],
  data = [], // [[[x, y]]]
  container,
  className,
}) {
  // make a path by points
  const lineGenerator = d3.line().x(d => d[0]).y(d => d[1])
  curve && lineGenerator.curve(d3[curve])
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
    path: lineGenerator(points),
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('path')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('stroke-dasharray', d => d.strokeDasharray)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('stroke-linecap', 'round')
      .attr('d', d => d.path)
      .attr('fill', 'none')
      .attr('opacity', d => d.opacity)
      .attr('filter', d => d.filter)
      .attr('mask', d => d.mask)
  }
  if (engine === 'canvas') {
    configuredData.forEach(config => {
      const path = new fabric.Path(config.path, {
        className: config.className,
        fill: null,
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeDashArray: String(config.strokeDasharray).trim().split(' ').map(Number),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        source: config.source,
        selectable: false,
      })
      container.add(path)
    })
  }
}
