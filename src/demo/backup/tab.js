import Layout from '../../layout'

// 切换按钮数据生成
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
  padding: [60, 60, 60, 60],
  // 这个 layout 应该是一个生成函数
  layout,

  // 图层数据，下标顺序代表绘制顺序
  layers: [
    // 标题文字图层
    {
      type: 'tabButton',
      options: {
        id: 'tabButton',
        layout: 'main',
      },
      data: [
        ['key', 'location'],
        ['tab1', 1],
        ['tab2', 2],
        ['tab3', 3],
      ],
      style: {},
    },
  ],
})

export default {
  tabButton: (container, theme) => createSchema(container, theme, Layout.standard(false)),
}
