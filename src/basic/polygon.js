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
  position = [], // 直角坐标系二维表坐标数据
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((point, index) => {
    const [cx, cy] = position[index]
    return {
      class: className,
      points: point,
      fill,
      opacity,
      stroke,
      strokeWidth,
      style: `transform: translate(${cx}px, ${cy}px)`,
    }
  })

  const polygons = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('polygon')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('class', d => d.class)
    .attr('opacity', d => d.opacity)
    .attr('style', d => d.style)
    .attr('fill', d => d.fill)

  return polygons
}
