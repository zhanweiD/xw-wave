import * as d3 from 'd3'
import {isArray} from 'lodash'
import {fabric} from 'fabric'
import chroma from 'chroma-js'

// 绘制一组面积
export default function drawArea({
  engine = 'svg',
  fill = '#fff',
  stroke = '#fff',
  strokeWidth = 0,
  opacity = 1,
  fillOpacity = 1,
  strokeOpacity = 1,
  curve = false,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  position = [], // 位置 [[[x,y0,y1]]]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const areaGenerator = d3.area().x(d => d[0]).y0(d => d[1]).y1(d => d[2])
  curve && areaGenerator.curve(d3[curve])
  const configuredData = position.map((data, i) => ({
    className,
    fill: isArray(fill) ? fill[i] : fill,
    stroke: isArray(stroke) ? stroke[i] : stroke,
    opacity: isArray(opacity) ? opacity[i] : opacity,
    fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
    strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
    strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
    filter: isArray(filter) ? filter[i] : filter,
    mask: isArray(mask) ? mask[i] : mask,
    path: areaGenerator(data),
    source: source.length > i ? source[i] : null,
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
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('fill', d => d.fill)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('pointer-events', 'none')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const path = new fabric.Path(config.path, {
        className: config.className,
        fill: chroma(config.fill || '#000').alpha(config.fillOpacity),
        stroke: chroma(config.stroke || '#000').alpha(config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
      })
      // 覆盖或追加
      if (container.getObjects().length <= i) {
        container.addWithUpdate(path)
      } else {
        container.item(i).set(path)
      }
    })
  }
}
