import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../util/common'

// 绘制一组直线
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
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  position = [], // 位置 [[x1,y1,x2,y2]]
  container,
  className,
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = position.map((data, i) => ({
    className,
    stroke: getAttr(stroke, i),
    opacity: getAttr(opacity, i),
    strokeOpacity: getAttr(strokeOpacity, i),
    strokeWidth: getAttr(strokeWidth, i),
    source: getAttr(source, i),
    filter: getAttr(filter, i),
    mask: getAttr(mask, i),
    strokeDasharray: getAttr(dasharray, i),
    x1: data[0],
    y1: data[1],
    x2: data[2],
    y2: data[3],
  }))
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
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
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const line = new fabric.Line([config.x1, config.y1, config.x2, config.y2], {
        className: config.className,
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeDashArray: String(config.strokeDasharray).split(' '),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
      })
      // 覆盖或追加
      if (container.getObjects().length <= i) {
        container.addWithUpdate(line)
      } else {
        container.item(i).set(line)
      }
    })
  }
}
