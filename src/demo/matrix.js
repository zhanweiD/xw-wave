import createStandardLayout from '../layout/standard'

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
  padding: [60, 40, 40, 40],
  // 这个 layout 应该是一个生成函数
  layout,
  // 声明坐标系
  coordinate: 'cartesian-bind-bind',

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
    // 直角坐标组合
    {
      type: 'axis',
      options: {
        id: 'axis',
        layout: 'main',
        type: 'cartesian',
      },
      style: {
      },
    },
    // 热力图层
    {
      type: 'matrix',
      options: {
        id: 'matrix',
        layout: 'main',
        axis: 'main',
        mode,
      },
      data: {
        type: 'table',
        mode: 'normal', 
        row: 8,
        column: 8,
        mu: 1000,
        sigma: 400,
        decimalNumber: 1,
      },
      scale: {
        paddingInner: 0,
      },
      style: {
        circleSize: ['auto', 'auto'],
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
