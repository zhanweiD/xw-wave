import * as d3 from 'd3'
import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../util/common'

// 绘制一组曲线
export default function drawCurve({
  engine = 'svg',
  stroke = '#fff',
  opacity = 1,
  strokeOpacity = 1,
  strokeWidth = 1,
  curve = false,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  position = [], // 位置 [[[x,y]]]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const lineGenerator = d3.line().x(d => d[0]).y(d => d[1])
  curve && lineGenerator.curve(d3[curve])
  const configuredData = position.map((data, i) => ({
    className,
    stroke: getAttr(stroke, i),
    opacity: getAttr(opacity, i),
    strokeOpacity: getAttr(strokeOpacity, i),
    strokeWidth: getAttr(strokeWidth, i),
    source: getAttr(source, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
    path: lineGenerator(data),
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
      .attr('d', d => d.path)
      .attr('fill', 'none')
      .attr('opacity', d => d.opacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .attr('stroke-linecap', 'round')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const path = new fabric.Path(config.path, {
        className: config.className,
        fill: null,
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
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
