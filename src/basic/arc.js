import * as d3 from 'd3'

// 绘制一组圆弧
export default function drawArc({
  fill = 'rgba(255,255,255,1)',
  stroke = 'rgba(255,255,255,0)',
  strokeWidth = 0,
  opacity = 1,
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  data = [], // 圆弧出入角内外半径二维表数据
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
      opacity,
      fill: Array.isArray(fill) ? fill[i] : fill,
      stroke: Array.isArray(stroke) ? stroke[i] : stroke,
      strokeWidth,
      d: arc({startAngle: Math.PI * (startAngle / 180), endAngle: Math.PI * (endAngle / 180)}),
      transform: `translate(${x}px, ${y}px)`,
      source: source.length > i ? source[i] : null,
    }
  })

  const arcs = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('path')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('class', d => d.className)
    .attr('opacity', d => d.opacity)
    .attr('fill', d => d.fill)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('d', d => d.d)
    .style('transform', d => d.transform)

  return arcs
}
