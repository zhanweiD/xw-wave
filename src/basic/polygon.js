// 绘制一组多边形
export default function drawPolygon({
  fill = 'rgba(255,255,255,1)', // 颜色
  stroke = 'rgba(255,255,255,0)', // 描边
  strokeWidth = 0, // 描边粗细
  opacity = 1, // 不透明度
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  data = [],
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((points, index) => {
    return {
      className,
      points: points.reduce((prev, cur) => `${prev} ${cur[0]},${cur[1]}`, ''),
      fill: Array.isArray(fill) ? fill[index] : fill,
      stroke: Array.isArray(stroke) ? stroke[index] : stroke,
      strokeWidth,
      opacity,
    }
  })

  const polygons = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('polygon')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('class', d => d.className)
    .attr('points', d => d.points)
    .attr('fill', d => d.fill)
    .attr('opacity', d => d.opacity)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    
  return polygons
}
