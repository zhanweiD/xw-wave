import {createTableData} from './mock'
import createStandardLayout from '../layout/standard'

const data = createTableData()
const titleMapping = {
  rect: '矩形热力图',
  circle: '圆形热力图',
}

// 矩阵配置数据生成
const createSchema = (container, theme, layout, mode) => ({
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
      data: titleMapping[mode],
      style: {
        text: {
          fontSize: 16,
        },
      },
    },
    // X坐标轴图层
    {
      type: 'axis',
      options: {
        id: 'axisX',
        layout: 'axisX',
        bind: 'matrix',
      },
      style: {
        orient: 'bottom',
        type: 'axisX',
        label: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
    },
    // Y坐标轴图层
    {
      type: 'axis',
      options: {
        id: 'axisY',
        layout: 'axisY',
        bind: 'matrix',
      },
      style: {
        orient: 'left',
        type: 'axisY',
        tickLine: {
          opacity: 0.2,
        },
        label: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
    },
    // 热力图层
    {
      type: 'matrix',
      options: {
        id: 'matrix',
        layout: 'main',
        mode,
      },
      data,
      style: {
        rect: {
          enableUpdateAnimation: true,
        },
        text: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
      animation: {
        rect: {
          enterAnimation: {
            type: 'zoom',
            delay: 0,
            duration: 2000,
            mode: 'enlarge',
            direction: 'both',
          },
        },
        circle: {
          enterAnimation: {
            type: 'zoom',
            delay: 0,
            duration: 2000,
            mode: 'enlarge',
            direction: 'both',
          },
        },
        text: {
          enterAnimation: {
            type: 'fade',
            delay: 2000,
            duration: 1000,
            mode: 'fadeIn',
          },
        },
      },
      tooltip: {
        mode: 'single',
        targets: ['rect', 'circle'],
      },
      event: {
        'click-rect': d => console.log(d),
        'click-circle': d => console.log(d),
      },
    },
  ],
})

export default {
  rectHeatmap: (container, theme) => createSchema(container, theme, createStandardLayout, 'rect'),
  circleHeatmap: (container, theme) => createSchema(container, theme, createStandardLayout, 'circle'),
}
