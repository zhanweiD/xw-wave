import * as d3 from 'd3'
import {isArray} from 'lodash'
import {Graphics} from 'pixi.js'
import chroma from 'chroma-js'
import '@pixi/graphics-extras'

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
    const [x, y] = position[i]
    const [startAngle, endAngle, innerRadius, outerRadius] = value
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)
    return {
      className,
      data: {x, y, startAngle, endAngle, innerRadius, outerRadius},
      fill: isArray(fill) ? fill[i] : fill,
      stroke: isArray(stroke) ? stroke[i] : stroke,
      opacity: isArray(opacity) ? opacity[i] : opacity,
      fillOpacity: isArray(fillOpacity) ? fillOpacity[i] : fillOpacity,
      strokeOpacity: isArray(strokeOpacity) ? strokeOpacity[i] : strokeOpacity,
      strokeWidth: isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
      filter: isArray(filter) ? filter[i] : filter,
      mask: isArray(mask) ? mask[i] : mask,
      d: arc({startAngle: Math.PI * (startAngle / 180), endAngle: Math.PI * (endAngle / 180)}),
      source: source.length > i ? source[i] : null,
      transform: `translate(${x}px, ${y}px)`,
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
      .attr('d', d => d.d)
      .attr('fill', d => d.fill)
      .attr('stroke', d => d.stroke)
      .attr('stroke-width', d => d.strokeWidth)
      .attr('mask', d => d.mask)
      .attr('filter', d => d.filter)
      .style('transform', d => d.transform)
      .style('outline', 'none')
  }
  if (engine === 'canvas') {
    configuredData.forEach((config, i) => {
      const graphics = new Graphics()
      const {x, y, innerRadius, outerRadius, startAngle, endAngle} = config.data
      const getColor = color => chroma(color || '#000').hex().replace('#', '0x')
      const getArc = angle => ((angle - 90) / 180) * Math.PI
      graphics.className = config.className
      graphics.lineStyle(config.strokeWidth, getColor(config.stroke), config.strokeOpacity)
      graphics.beginFill(getColor(config.fill), config.fillOpacity)
      graphics.drawTorus(x, y, innerRadius, outerRadius, getArc(startAngle), getArc(endAngle))
      graphics.endFill()
      // 覆盖或追加
      if (container.children.length <= i) {
        container.addChild(graphics)
      } else {
        container.children[i] = graphics
      }
    })
  }
}
