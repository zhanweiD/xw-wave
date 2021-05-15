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
      },
      data: data[0].slice(1),
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
    // 雷达图层
    {
      type: 'radar',
      options: {
        id: 'arc',
        layout: 'main',
        mode,
      },
      data,
      style: {
        circle: {
          enableUpdateAnimation: true,
        },
        polygon: {
          enableUpdateAnimation: true,
        },
        text: {
          hide: true,
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
      animation: {
        arc: {
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
        polygon: null,
      },
      event: {
        'click-polygon': d => console.log(d),
      },
    },
  ],
})

export default {
  radar: (container, theme) => createSchema(container, theme, standardLayout, 'default'),
  stackRadar: (container, theme) => createSchema(container, theme, standardLayout, 'stack'),
}
