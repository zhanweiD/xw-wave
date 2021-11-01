import {createDashboardData} from './mock'
import Layout from '../../layout'

// 仪表盘数据生成
const createSchema = (container, theme, layout, type) => ({
  // 容器
  container,
  // 颜色主题
  theme,
  // 图表适应容器的方式
  adjust: 'auto',
  // 容器宽，自适应为 auto 时无效
  width: 100,
  // 容器高，自适应为 auto 时无效
  height: 100,
  // 主绘图图层的内边距
  padding: [60, 40, 40, 40],
  // 这个 layout 应该是一个生成函数
  layout,

  // 图层数据，下标顺序代表绘制顺序
  layers: [
    // 标题文字图层
    {
      type: 'text',
      options: {
        id: 'title',
        layout: 'title',
      },
      data: '仪表盘',
      style: {
        text: {
          fontSize: 16,
        },
      },
    },
    // 仪表盘层
    {
      type: 'dashboard',
      options: {
        id: 'dashboard',
        layout: 'main',
      },
      data: createDashboardData(type),
      style:
        type === 'dashboard'
          ? {
            tickSize: 10,
            valueText: {
              fontSize: 15,
            },
          }
          : {
            step: [2, 10],
            startAngle: 0,
            endAngle: 360,
            arcWidth: 15,
            tickSize: 10,
            pointerSize: 5,
            tickLine: {
              hide: true,
            },
            pointer: {
              hide: true,
            },
            pointerAnchor: {
              hide: 'true',
            },
            tickText: {
              hide: true,
            },
            valueText: {
              fontSize: 15,
              offset: [0, 0],
            },
          },
    },
  ],
})

export default {
  dashboard: (container, theme) => createSchema(container, theme, Layout.standard(false), 'dashboard'),
  indicator: (container, theme) => createSchema(container, theme, Layout.standard(false), 'indicator'),
}
