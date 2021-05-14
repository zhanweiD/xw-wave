import {useEffect, useRef} from 'react'
import Wave from '../wave'
import s from './demo.module.css'

const titleMapping = {
  gauge: '普通仪表盘',
}

let gaugeWave

export default function Column({data = [[]], type = 'column', theme}) {
  const gaugeRef = useRef(null)
 
  useEffect(() => {
    gaugeWave = new Wave({container: gaugeRef.current, theme})
  }, [theme, window.innerHeight, window.innerWidth])

  useEffect(() => {
    updateWave({wave: gaugeWave, type: 'gauge', data})
  }, [data, type, theme])
  
  return (
    <div className="fbh fb1 fbw">
      <div className={s.wave} ref={gaugeRef} />
    </div>
  )
}

const updateWave = ({wave, data, type}) => {
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
    offset: 15,
    rect: {
      fontSize: 12,
      enableUpdateAnimation: true,
    },
    valueText: {
      fontSize: 14,
    },
  })
  gaugeLayer.draw()
}
