import {isArray} from 'lodash'
import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../utils/common'

export default function drawPolygon({
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
  data = [], // [[[pointX, pointY]]]
  position = [], // [[offsetX, offsetY]]
  container,
  className,
}) {
  const configuredData = data.map((points, i) => ({
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
    pointArray: points.map(([x, y]) => ({x, y})),
    pointString: points.reduce((prev, cur) => `${prev} ${cur[0]},${cur[1]}`, ''),
    position: isArray(position) && isArray(position[0]) ? position[i] : position,
  }))
  if (engine === 'svg') {
    container
      .selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('polygon')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('points', d => d.pointString)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform-origin', d => `${d.position[0]}px ${d.position[1]}px`)
  } else if (engine === 'canvas') {
    configuredData.forEach(config => {
      const polygon = new fabric.Polygon(config.pointArray, {
        className: config.className,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        source: config.source,
        selectable: false,
      })
      container.add(polygon)
    })
  }
}
