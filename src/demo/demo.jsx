import {Children, useEffect, useState} from 'react'
import c from 'classname'
import ThemeConfig from '../util/theme'
import Column from './column'
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
}

const getData = () => {
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
  const column = Math.round(Math.random() * (originalData[0].length - 3) + 2)
  const row = Math.round(Math.random() * (originalData.length - 5) + 4)
  const finalData = originalData.slice(0, row + 1).map(item => item.slice(0, column + 1))
  return finalData
}

export default function Demo() {
  const [theme, setTheme] = useState('duskUniverse')
  const [chart, setChart] = useState('column')
  const [data, setData] = useState(getData())
  const autoSwitchDataTime = 10000
  const containerStyle = {
    background: ThemeConfig[theme].background,
  }

  useEffect(() => {
    const timer = setTimeout(() => setData(getData()), autoSwitchDataTime)
    return () => clearTimeout(timer)
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
      </div>
    </div>
  )
}
