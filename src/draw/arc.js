import * as d3 from 'd3'
import {isArray} from 'lodash'
import {fabric} from 'fabric'
import {mergeAlpha, getAttr} from '../util/common'

// 绘制一组圆弧
export default function drawArc({
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
  mapping = item => item, // 高级数据过滤函数
  mask = null, // 遮罩
  filter = null, // 滤镜
  source = [], // 原始数据
  data = [], // 圆弧出入角和内外半径数据
  position = [], // 圆心位置
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((value, i) => {
    const [startAngle, endAngle, innerRadius, outerRadius] = value
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
    return {
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
      path: arc({startAngle: Math.PI * (startAngle / 180), endAngle: Math.PI * (endAngle / 180)}),
      position: isArray(position) && isArray(position[0]) ? position[i] : position,
    }
  })
  if (engine === 'svg') {
    container.selectAll(`.${className}`)
      .data(configuredData.map(item => mapping(item)))
      .join('path')
      .attr('class', d => d.className)
      .transition()
      .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
      .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
      .attr('opacity', d => d.opacity)
      .attr('fill-opacity', d => d.fillOpacity)
      .attr('stroke-opacity', d => d.strokeOpacity)
      .attr('d', d => d.path)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform', d => `translate(${d.position[0]}px,${d.position[1]}px)`)
      .style('outline', 'none')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const path = new fabric.Path(config.path, {
        className: config.className,
        fill: mergeAlpha(config.fill, config.fillOpacity),
        stroke: mergeAlpha(config.stroke, config.strokeOpacity),
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
      })
      // 整体位移
      path.left += config.position[0]
      path.top += config.position[1]
      // 覆盖或追加
      if (container.getObjects().length <= i) {
        container.addWithUpdate(path)
      } else {
        container.item(i).set(path)
      }
    })
  }
}
