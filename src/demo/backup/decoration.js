import Layout from '../layout'

// 柱状图配置数据生成
const createSchema = (container, theme, layerName, style) => {
  const schema = {
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
    layout: Layout.standard(false),
    // 声明坐标系
    coordinate: 'cartesian-bind-linear',

    // 图层数据，下标顺序代表绘制顺序
    layers: [
      {
        type: layerName,
        options: {
          id: layerName,
          layout: 'title',
        },
        data: null,
        style: {
          ...style,
        },
      },
    ],
  }
  return schema
}

export default {
  titleA: (container, theme) => createSchema(container, theme, 'titleA'),
  titleBAvtive: (container, theme) => createSchema(container, theme, 'titleB', {avtive: true}),
  titleBInactive: (container, theme) => createSchema(container, theme, 'titleB', {active: false}),
  titleC: (container, theme) => createSchema(container, theme, 'titleC'),
  titleD1: (container, theme) => createSchema(container, theme, 'titleD', {leftIcon: 'arrow'}),
  titleD2: (container, theme) => createSchema(container, theme, 'titleD', {leftIcon: 'point'}),
  titleE: (container, theme) => createSchema(container, theme, 'titleE', {}),
  borderA: (container, theme) => createSchema(container, theme, 'borderA', {}),
}
