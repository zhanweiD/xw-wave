import {createTableListData} from './mock'
import standardLayout from '../layout/standard'

const data = createTableListData()
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
    // 图例图层
    {
      type: 'legend',
      options: {
        id: 'legend',
        layout: 'legend',
        bind: 'radar',
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
    // 角度轴
    {
      type: 'axis',
      options: {
        id: 'axisAngle',
        layout: 'main',
        type: 'angle',
        bind: 'radar',
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
    // 半径轴
    {
      type: 'axis',
      options: {
        id: 'axisRadius',
        layout: 'main',
        bind: 'radar',
        type: 'radius',
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
        mode,
      },
      data,
      style: {
        pointSize: 5,
        circle: {
          enableUpdateAnimation: true,
        },
        polygon: {
          enableUpdateAnimation: true,
        },
        text: {
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
      animation: {
        polygon: {
          enterAnimation: {
            type: 'zoom',
            delay: 0,
            duration: 2000,
            mode: 'enlarge',
            direction: 'both',
          },
          loopAnimation: {
            type: 'scan',
            delay: 1000,
            duration: 3000,
            color: 'rgba(255,255,255,0.5)',
            direction: 'outer',
          },
        },
        circle: {
          enterAnimation: {
            type: 'fade',
            delay: 2000,
            duration: 1000,
            mode: 'fadeIn',
          },
          loopAnimation: {
            type: 'breathe',
            delay: 1000,
            duration: 2000,
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
        targets: ['circle'],
      },
      event: {
        'click-circle': d => console.log(d),
      },
    },
  ],
})

export default {
  radar: (container, theme) => createSchema(container, theme, standardLayout, 'default'),
  stackRadar: (container, theme) => createSchema(container, theme, standardLayout, 'stack'),
}
