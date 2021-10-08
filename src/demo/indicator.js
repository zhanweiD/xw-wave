import Layout from '../layout'

// 指标卡数据生成
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
  padding: [0, 0, 0, 0],
  // 这个 layout 应该是一个生成函数
  layout,

  // 图层数据，下标顺序代表绘制顺序
  layers: [
    // 标题文字图层
    {
      type: 'indicator',
      options: {
        id: 'indicator',
        layout: 'main',
      },
      data: [
        ['跨境电商交易额'],
        [
          {
            text: '82828',
            fontSize: 30,
            fill: 'skyblue',
            shadow: '2px 2px 2px gray',
          },
          {
            text: '万元',
            fontSize: 12,
          },
        ],
      ],
      style: {
        verticalAlign: 'middle',
        text: {
          fontSize: 16,
          fill: 'lightgray',
        },
      },
    },
  ],
})

export default {
  indicator: (container, theme) => createSchema(container, theme, Layout.standard(false)),
}
