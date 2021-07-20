import {getStandardLayoutWithBrush} from '../layout/standard'
import {createTableListData} from './mock'

const titleMapping = {
  scatter: '散点图',
  bubble: '气泡图',
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
  // 声明坐标系
  coordinate: 'cartesian-linear-linear',

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
    // X辅助线图层
    {
      type: 'auxiliary',
      options: {
        id: 'auxiliary1',
        layout: 'main',
        type: 'horizontal',
        bind: 'axis',
      },
      data: [100, 200],
      style: {
        labelPosition: 'right',
        line: {
          stroke: 'yellow',
          strokeWidth: 2,
          dasharray: '10 5',
        },
        text: {
          fill: 'yellow',
          fontSize: 8,
        },
      },
    },
    // Y辅助线图层
    {
      type: 'auxiliary',
      options: {
        id: 'auxiliary2',
        layout: 'main',
        type: 'vertical',
        bind: 'axis',
      },
      data: [400],
      style: {
        labelPosition: 'top',
        line: {
          stroke: 'yellow',
          strokeWidth: 2,
          dasharray: '10 5',
        },
        text: {
          fill: 'yellow',
          fontSize: 8,
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
    // 点图层
    {
      type: 'scatter',
      options: {
        id: 'scatter',
        layout: 'main',
        axis: 'main',
        mode,
      },
      data: createTableListData().map(item => [item[1], item[2], item[0], item[3]]),
      scale: {
        count: 5,
        // fixedPaddingInner: 10,
        // fixedBandWidth: 30,
        fixedBoundary: 'start',
      },
      style: {
        circleSize: mode === 'bubble' ? [10, 30] : [5, 5],
        circle: {
          enableUpdateAnimation: true,
        },
        text: {
          hide: true,
          fontSize: 10,
          enableUpdateAnimation: true,
        },
      },
      animation: {
        circle: {
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
  scatter: (container, theme) => createSchema(container, theme, getStandardLayoutWithBrush, 'scatter'),
  bubble: (container, theme) => createSchema(container, theme, getStandardLayoutWithBrush, 'bubble'),
}
