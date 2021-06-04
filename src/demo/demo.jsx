import {Children, useRef, useEffect, useState} from 'react'
import c from 'classname'
import {range} from 'd3'
import ThemeConfig from '../util/theme'
import columnSchema from './column'
import pieSchema from './pie'
import radarSchema from './radar'
import scatterSchema from './scatter'
import matrixSchema from './matrix'
import gaugeSchema from './gauge'
import lineSchema from './line'
import Parser from '../parser'
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

export default function Example() {
  const [theme, setTheme] = useState('fairyLand')
  const [chart, setChart] = useState('column')
  const containerStyle = {background: ThemeConfig[theme].background}
  const refs = range(1, 100, 1).map(() => useRef(null))

  useEffect(() => {
    const waves = []
    // 柱状图和条形图
    waves.push(chart === 'column' && Parser.createWave(columnSchema.groupColumn(refs[1].current, theme)))
    waves.push(chart === 'column' && Parser.createWave(columnSchema.stackColumn(refs[2].current, theme)))
    waves.push(chart === 'column' && Parser.createWave(columnSchema.intervalColumn(refs[3].current, theme)))
    waves.push(chart === 'column' && Parser.createWave(columnSchema.waterfallColumn(refs[4].current, theme)))
    waves.push(chart === 'column' && Parser.createWave(columnSchema.groupLineColumn(refs[29].current, theme)))
    waves.push(chart === 'column' && Parser.createWave(columnSchema.stackLineColumn(refs[30].current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(columnSchema.groupBar(refs[5].current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(columnSchema.stackBar(refs[6].current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(columnSchema.intervalBar(refs[7].current, theme)))
    waves.push(chart === 'bar' && Parser.createWave(columnSchema.waterfallBar(refs[8].current, theme)))
    // 饼图类
    waves.push(chart === 'pie' && Parser.createWave(pieSchema.pie(refs[9].current, theme)))
    waves.push(chart === 'pie' && Parser.createWave(pieSchema.donut(refs[10].current, theme)))
    waves.push(chart === 'pie' && Parser.createWave(pieSchema.nightingaleRose(refs[11].current, theme)))
    waves.push(chart === 'pie' && Parser.createWave(pieSchema.donutNightingaleRose(refs[12].current, theme)))
    waves.push(chart === 'pie' && Parser.createWave(pieSchema.stackNightingaleRose(refs[13].current, theme)))
    waves.push(chart === 'pie' && Parser.createWave(pieSchema.stackDonutNightingaleRose(refs[14].current, theme)))
    // 雷达图类
    waves.push(chart === 'radar' && Parser.createWave(radarSchema.radar(refs[15].current, theme)))
    waves.push(chart === 'radar' && Parser.createWave(radarSchema.stackRadar(refs[16].current, theme)))
    // 点图类
    waves.push(chart === 'scatter' && Parser.createWave(scatterSchema.scatter(refs[17].current, theme)))
    waves.push(chart === 'scatter' && Parser.createWave(scatterSchema.bubble(refs[18].current, theme)))
    // 热力图类
    waves.push(chart === 'matrix' && Parser.createWave(matrixSchema.rectHeatmap(refs[19].current, theme)))
    waves.push(chart === 'matrix' && Parser.createWave(matrixSchema.circleHeatmap(refs[20].current, theme)))
    // 仪表盘
    waves.push(chart === 'gauge' && Parser.createWave(gaugeSchema.gauge(refs[21].current, theme)))
    waves.push(chart === 'gauge' && Parser.createWave(gaugeSchema.indicator(refs[28].current, theme)))
    // 折线类
    waves.push(chart === 'line' && Parser.createWave(lineSchema.line(refs[22].current, theme)))
    waves.push(chart === 'line' && Parser.createWave(lineSchema.stackLine(refs[23].current, theme)))
    waves.push(chart === 'line' && Parser.createWave(lineSchema.area(refs[24].current, theme)))
    waves.push(chart === 'line' && Parser.createWave(lineSchema.stackArea(refs[25].current, theme)))
    waves.push(chart === 'line' && Parser.createWave(lineSchema.step(refs[26].current, theme)))
    waves.push(chart === 'line' && Parser.createWave(lineSchema.stepArea(refs[27].current, theme)))
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
          {chart === 'column' && <div className={s.wave} ref={refs[1]} /> }
          {chart === 'column' && <div className={s.wave} ref={refs[2]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[3]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[4]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[29]} />}
          {chart === 'column' && <div className={s.wave} ref={refs[30]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[5]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[6]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[7]} />}
          {chart === 'bar' && <div className={s.wave} ref={refs[8]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[9]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[10]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[11]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[12]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[13]} />}
          {chart === 'pie' && <div className={s.wave} ref={refs[14]} />}
          {chart === 'radar' && <div className={s.wave} ref={refs[15]} />}
          {chart === 'radar' && <div className={s.wave} ref={refs[16]} />}
          {chart === 'scatter' && <div className={s.wave} ref={refs[17]} />}
          {chart === 'scatter' && <div className={s.wave} ref={refs[18]} />}
          {chart === 'matrix' && <div className={s.wave} ref={refs[19]} />}
          {chart === 'matrix' && <div className={s.wave} ref={refs[20]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[21]} />}
          {chart === 'gauge' && <div className={s.wave} ref={refs[28]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[22]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[23]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[24]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[25]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[26]} />}
          {chart === 'line' && <div className={s.wave} ref={refs[27]} />}
        </div>
      </div>
    </div>
  )
}
