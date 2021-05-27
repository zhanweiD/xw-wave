import {createGaugeData} from './mock'
import createStandardLayout from '../layout/standard'

const data = createGaugeData()

// 仪表盘数据生成
const createSchema = (container, theme, layout) => ({
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
  padding: [0, 50, 30, 50],
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
      type: 'gauge',
      options: {
        id: 'gauge',
        layout: 'main',
      },
      data,
      style: {
        valueText: {
          fontSize: 15,
        },
      },
    },
  ],
})

export default {
  gauge: (container, theme) => createSchema(container, theme, createStandardLayout),
}
