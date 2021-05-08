// 绘制一组圆形（含椭圆）
export default function drawCircle({
  fill = 'rgba(255,255,255,1)', // 颜色
  stroke = 'rgba(255,255,255,0)', // 描边
  strokeWidth = 0, // 描边粗细
  opacity = 1, // 不透明度
  enableUpdateAnimation = false,
  updateAnimationDuration = 2000,
  updateAnimationDelay = 0,
  source = [], // 原始数据
  data = [], // 水平垂直半径列表数据
  position = [], // 直角坐标系坐标数据
  container, // 容器父节点
  className, // 用于定位
}) {
  // 为每一个元素生成单独的配置 JSON 用于绘制
  const configuredData = data.map((size, i) => {
    const [rx, ry] = size
    const [cx, cy] = position[i]
    return {
      class: className,
      cx,
      cy,
      rx,
      ry,
      fill: Array.isArray(fill) ? fill[i] : fill,
      stroke: Array.isArray(stroke) ? stroke[i] : stroke,
      opacity,
      strokeWidth,
      source: source.length > i ? source[i] : null,
    }
  })

  const circles = container.selectAll(`.${className}`)
    .data(configuredData)
    .join('ellipse')
    .transition()
    .duration(enableUpdateAnimation ? updateAnimationDuration : 0)
    .delay(enableUpdateAnimation ? updateAnimationDelay : 0)
    .attr('stroke', d => d.stroke)
    .attr('stroke-width', d => d.strokeWidth)
    .attr('class', d => d.class)
    .attr('opacity', d => d.opacity)
    .attr('cx', d => d.cx)
    .attr('cy', d => d.cy)
    .attr('rx', d => d.rx)
    .attr('ry', d => d.ry)
    .attr('fill', d => d.fill)

  return circles
}
