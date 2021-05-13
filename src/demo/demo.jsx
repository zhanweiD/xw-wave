import {Children, useEffect, useState} from 'react'
import c from 'classname'
import ThemeConfig from '../util/theme'
import Column from './column'
import Line from './line'
import Pie from './pie'
import Radar from './radar'
import Scatter from './scatter'
import Matrix from './matrix'
import Gauge from './gauge'
import s from './demo.module.css'

const themeMapping = {
  fairyLand: '梦幻岛',
  emeraldGreen: '冷翡翠',
  duskUniverse: '黄昏宇宙',
  glaze: '琉璃盏',
  exquisite: '玲珑伞',
}

const chartMapping = {
  column: '柱状图',
  bar: '条形图',
  line: '折线图',
  pie: '饼图',
  radar: '雷达图',
  scatter: '点图',
  matrix: '矩阵图',
  gauge: '仪表盘',
}

const getTableListData = () => {
  const originalData = [
    ['年份', '中等专业学校', '成人中专', '职业高中', '技工学校'], 
    ['1985', 157.1, 40, 184.3, 74.2], 
    ['1990', 224.4, 158.8, 247.1, 133.2], 
    ['2000', 489.5, 169.3, 414.6, 140.1], 
    ['2005', 629.8, 112.5, 582.4, 275.3], 
    ['2007', 781.6, 113, 725.2, 367.1], 
    ['2009', 840.4, 161, 778.4, 398.8], 
    ['2011', 855.2, 238.7, 681, 430.4], 
    ['2013', 772.2, 230, 534.2, 386.6], 
    ['2015', 732.7, 162.7, 439.9, 321.5], 
    ['2016', 718.1, 141.2, 416.6, 323.2],
  ]
  const column = Math.floor(Math.random() * (originalData[0].length - 4) + 4)
  const row = Math.floor(Math.random() * (originalData.length - 6) + 3)
  const finalData = originalData.slice(0, row + 1).map(item => item.slice(0, column + 1))
  return finalData
}

const getTableData = () => {
  const rows = ['2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018']
  const columns = ['河北', '山西', '辽宁', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南']
  const data = [
    [1811, 1871, 1951, 2006, 2063, 2108, 2098, 2141, 2191, 2328, 2457],
    [1979, 2050, 2132, 2202, 2351, 2474, 2519, 2504, 2439, 2401, 2383],
    [2621, 2659, 2671, 2712, 2811, 2903, 2933, 2876, 2845, 2859, 2866],
    [2352, 2420, 2447, 2409, 2441, 2529, 2555, 2518, 2427, 2403, 2405],
    [2679, 2786, 2819, 2824, 2786, 2814, 2858, 2896, 2937, 3045, 3143],
    [2324, 2303, 2285, 2218, 2288, 2363, 2408, 2414, 2355, 2345, 2370],
    [1658, 1742, 1841, 2007, 2101, 2203, 2245, 2309, 2259, 2250, 2245],
    [1937, 2039, 2144, 2200, 2301, 2435, 2513, 2508, 2438, 2352, 2355], 
    [2062, 2118, 2162, 2212, 2295, 2381, 2527, 2654, 2698, 2676, 2771], 
    [2071, 2153, 2202, 2191, 2238, 2304, 2421, 2516, 2620, 2519, 2588], 
    [1648, 1774, 1839, 1901, 2012, 2114, 2203, 2293, 2352, 2455, 2653],
  ]
  const columnNumber = Math.floor(Math.random() * (rows.length - 7) + 7)
  const rowNumber = Math.floor(Math.random() * (columns.length - 7) + 7)
  const finalData = [
    rows.slice(0, rowNumber),
    columns.slice(0, columnNumber),
    data.slice(0, rowNumber).map(array => array.slice(0, columnNumber)),
  ]
  return finalData
}

const getGaugeData = () => {
  return {
    value: Math.floor(Math.random() * 100),
    label: '仪表盘',
    fragments: [[0, 30, '低'], [30, 60, '中'], [60, 100, '高']],
  }
}

export default function Demo() {
  const [theme, setTheme] = useState('duskUniverse')
  const [chart, setChart] = useState('column')
  const [data, setData] = useState(getTableListData())
  const autoSwitchDataTime = 10000
  const containerStyle = {
    background: ThemeConfig[theme].background,
  }

  // 监听窗口变化，300毫秒防抖
  // useEffect(() => {
  //   let interval
  //   const delay = 300
  //   const listener = () => {
  //     clearInterval(interval)
  //     interval = setTimeout(() => setData(getTableListData(), delay))
  //   }
  //   window.addEventListener('resize', listener)
  //   return () => window.removeEventListener('resize', listener)
  // }, [data])

  useEffect(() => {
    const timer = () => setTimeout(() => setData(getTableListData()), autoSwitchDataTime)
    requestAnimationFrame(timer)
  }, [data])

  return (
    <div className={c('fbv fb1', s.container)} style={containerStyle}>
      <div className="fbh fb1">
        <div className={s.activeText}>主题</div>
        {Object.keys(themeMapping).map(name => Children.toArray(
          <div className={c('hand', s.text, name === theme ? s.activeText : s.inactiveText)} onClick={() => setTheme(name)}>
            {themeMapping[name]}
          </div>
        ))}
      </div>
      <div className="fbh fb1">
        <div className={s.activeText}>图表</div>
        {Object.keys(chartMapping).map(name => Children.toArray(
          <div className={c('hand', s.text, name === chart ? s.activeText : s.inactiveText)} onClick={() => setChart(name)}>
            {chartMapping[name]}
          </div>
        ))}
      </div>
      <div className="fbh fb10">
        {chart === 'column' && <Column data={data} theme={theme} type="column" />}
        {chart === 'bar' && <Column data={data} theme={theme} type="bar" />}
        {chart === 'line' && <Line data={data} theme={theme} type="line" />}
        {chart === 'pie' && <Pie data={data} theme={theme} />}
        {chart === 'radar' && <Radar data={data} theme={theme} />}
        {chart === 'scatter' && <Scatter data={data} theme={theme} />}
        {chart === 'matrix' && <Matrix data={getTableData()} theme={theme} />}
        {chart === 'gauge' && <Gauge data={getGaugeData()} theme={theme} />}
      </div>
    </div>
  )
}
