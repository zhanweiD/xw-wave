import {useEffect, useRef} from 'react'
import Wave from '../wave'
import s from './demo.module.css'

const titleMapping = {
  gauge1: '分组图',
  gauge2: '堆叠图',
}

let gauge1Wave
let gauge2Wave

export default function Column({data = [[]], type = 'column', theme}) {
  const gauge1Ref = useRef(null)
  const gauge2Ref = useRef(null)
 
  useEffect(() => {
    gauge1Wave = new Wave({container: gauge1Ref.current, theme})
    gauge2Wave = new Wave({container: gauge2Ref.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: gauge1Wave, type: 'gauge1', data})
    updateWave({wave: gauge2Wave, type: 'gauge2', data})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbw">
      <div className={s.wave} ref={gauge1Ref} />
      <div className={s.wave} ref={gauge2Ref} />
    </div>
  )
}

// 分组柱状图
const updateWave = ({wave, data, type}) => {
  // 标题图层
  // 标题图层
  const titleIndex = wave.layer.findIndex(item => item.id === 'titleLayer')
  // titleIndex !== -1 && wave.layer[titleIndex].instance.destroy()
  const titleLayer = titleIndex !== -1 ? wave.layer[titleIndex].instance : wave.createLayer('text', {id: 'titleLayer', layout: wave.layout.title})
  titleLayer.setData(titleMapping[type])
  titleLayer.setStyle({
    text: {
      fontSize: 16,
    },
  })
  titleLayer.draw()

  // 仪表盘图层
  const gaugeIndex = wave.layer.findIndex(item => item.id === 'gaugeLayer')
  // gaugeIndex !== -1 && wave.layer[gaugeIndex].instance.destroy()
  const gaugeLayer = gaugeIndex !== -1 ? wave.layer[gaugeIndex].instance : wave.createLayer('gauge', {id: 'gaugeLayer', type, layout: wave.layout.main})
  gaugeLayer.setData(data)
  gaugeLayer.setStyle({
  })
  gaugeLayer.draw()
}
