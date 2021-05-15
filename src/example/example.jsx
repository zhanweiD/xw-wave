import {Children, useRef, useEffect, useState} from 'react'
import c from 'classname'
import ThemeConfig from '../util/theme'
import schemaCreator from './column'
import Parser from '../parser'
import s from './example.module.css'

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

export default function Example() {
  const [theme, setTheme] = useState('duskUniverse')
  const [chart, setChart] = useState('column')
  const containerStyle = {background: ThemeConfig[theme].background}
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const ref3 = useRef(null)
  const ref4 = useRef(null)
  const ref5 = useRef(null)
  const ref6 = useRef(null)
  const ref7 = useRef(null)
  const ref8 = useRef(null)

  useEffect(() => {
    const waves = []
    waves.push(chart === 'column' && Parser.createWave(schemaCreator.groupColumn(ref1.current, theme)))
    waves.push(chart === 'column' && Parser.createWave(schemaCreator.stackColumn(ref2.current, theme)))
    waves.push(chart === 'column' && Parser.createWave(schemaCreator.intervalColumn(ref3.current, theme)))
    waves.push(chart === 'column' && Parser.createWave(schemaCreator.waterfallColumn(ref4.current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(schemaCreator.groupBar(ref5.current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(schemaCreator.stackBar(ref6.current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(schemaCreator.intervalBar(ref7.current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(schemaCreator.waterfallBar(ref8.current, theme)))
  }, [theme, chart])

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
        <div className="fbh fb1 fbw">
          {chart === 'column' && <div className={s.wave} ref={ref1} /> }
          {chart === 'column' && <div className={s.wave} ref={ref2} />}
          {chart === 'column' && <div className={s.wave} ref={ref3} />}
          {chart === 'column' && <div className={s.wave} ref={ref4} />}
          {chart === 'bar' && <div className={s.wave} ref={ref5} />}
          {chart === 'bar' && <div className={s.wave} ref={ref6} />}
          {chart === 'bar' && <div className={s.wave} ref={ref7} />}
          {chart === 'bar' && <div className={s.wave} ref={ref8} />}
        </div>
      </div>
    </div>
  )
}
