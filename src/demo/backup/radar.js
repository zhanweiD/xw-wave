import Layout from '../../layout'

const titleMapping = {
  default: '雷达图',
  stack: '堆叠雷达图',
}

// 柱状图配置数据生成
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
  // 坐标系声明
  coordinate: 'polar-band-linear',

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
    // 图例图层
    {
      type: 'legend',
      options: {
        id: 'legend',
        layout: 'legend',
      },
      style: {
        align: 'end',
        verticalAlign: 'start',
        direction: 'horizontal', 
        pointSize: 8,
        gap: [5, 10],
        text: {
          fontSize: 12,
        },
      },
    },
    // 极坐标系
    {
      type: 'axis',
      options: {
        id: 'angle',
        layout: 'main',
        type: 'polar',
      },
      style: {
        tickLine: {
          opacity: 0.3,
          strokeWidth: 1,
          stroke: 'white',
          fill: 'none',
        },
      },
    },
    // 雷达图层
    {
      type: 'radar',
      options: {
        id: 'radar',
        layout: 'main',
        axis: 'main',
        mode,
      },
      data: {
        type: 'tableList',
        mode: 'normal', 
        row: 6,
        column: 3,
        mu: 500,
        sigma: 200,
        decimalPlace: 1,
      },
      style: {
        pointSize: 5,
        text: {
          fontSize: 10,
        },
      },
      animation: {
        polygon: {
          enter: {
            type: 'zoom',
            delay: 0,
            duration: 2000,
            mode: 'enlarge',
            direction: 'both',
          },
          loop: {
            type: 'scan',
            delay: 1000,
            duration: 3000,
            color: 'rgba(255,255,255,0.5)',
            direction: 'outer',
          },
        },
        circle: {
          enter: {
            type: 'fade',
            delay: 2000,
            duration: 1000,
            mode: 'fadeIn',
          },
          loop: {
            type: 'breathe',
            delay: 1000,
            duration: 2000,
          },
        },
        text: {
          enter: {
            type: 'fade',
            delay: 2000,
            duration: 1000,
            mode: 'fadeIn',
          },
        },
      },
      event: {
        'click-circle': d => console.log(d),
      },
    },
  ],
})

export default {
  radar: (container, theme) => createSchema(container, theme, Layout.standard(false), 'default'),
  stackRadar: (container, theme) => createSchema(container, theme, Layout.standard(false), 'stack'),
}
