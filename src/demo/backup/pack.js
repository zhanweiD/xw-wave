import Layout from '../layout'
import {createTreeData} from './mock'

// 柱状图配置数据生成
const createSchema = (container, theme, layout) => {
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
    padding: [60, 40, 40, 40],
    // 这个 layout 应该是一个生成函数
    layout,
    // 声明坐标系
    coordinate: 'cartesian-bind-linear',

    // 图层数据，下标顺序代表绘制顺序
    layers: [
      // 标题文字图层
      {
        type: 'text',
        options: {
          id: 'title',
          layout: 'title',
        },
        data: '打包图',
        style: {
          text: {
            fontSize: 16,
          },
        },
      },
      {
        type: 'pack',
        options: {
          id: 'pack',
          layout: 'main',
          zoom: true,
        },
        data: createTreeData(),
        style: {},
        animation: {
          circle: {
            updateAnimation: {},
          },
        },
      },
    ],
  }
  return schema
}

export default {
  pack: (container, theme) => createSchema(container, theme, Layout.standard(false)),
}
