import {createTableListData} from './mock'
import {getStandardLayoutWithBrush} from '../layout/standard'

const data = createTableListData()
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
    // X辅助线图层
    {
      type: 'auxiliary',
      options: {
        id: 'auxiliary',
        layout: 'main',
        type: 'horizontal',
        bind: 'scatter',
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
        id: 'auxiliary',
        layout: 'main',
        type: 'vertical',
        bind: 'scatter',
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
    // X坐标轴图层
    {
      type: 'axis',
      options: {
        id: 'axisX',
        layout: 'axisX',
        bind: 'scatter',
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
        bind: 'scatter',
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
    // 点图层
    {
      type: 'scatter',
      options: {
        id: 'scatter',
        layout: 'main',
        mode,
      },
      brush: {
        layout: 'brush',
        type: 'horizontal',
      },
      data,
      scale: {
        count: 4,
        zero: true,
      },
      style: {
        circleSizeRange: mode === 'bubble' ? [10, 30] : [5, 5],
        circle: {
          enableUpdateAnimation: true,
        },
        text: {
          hide: mode !== 'bubble',
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
