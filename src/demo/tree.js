import standardLayout from '../layout/standard'
import {createTreeData} from './mock'

// 柱状图配置数据生成
const createSchema = (container, theme, layout, type) => {
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
    layout,
    // 声明坐标系
    coordinate: 'any',

    // 图层数据，下标顺序代表绘制顺序
    layers: [
    // 标题文字图层
      {
        type: 'text',
        options: {
          id: 'title',
          layout: 'title',
        },
        data: '树形图',
        style: {
          text: {
            fontSize: 16,
          },
        },
      },
      {
        type: 'tree',
        options: {
          id: 'tree',
          layout: 'main',
          type,
        },
        data: createTreeData(),
        style: {
          labelOffset: 10,
          curve: {
            curve: type === 'horizontal' ? 'curveBumpX' : 'curveBumpY',
          },
        },
      },
    ],
  }
  return schema
}

export default {
  horizontalTree: (container, theme) => createSchema(container, theme, standardLayout, 'horizontal'),
  verticalTree: (container, theme) => createSchema(container, theme, standardLayout, 'vertical'),
}
