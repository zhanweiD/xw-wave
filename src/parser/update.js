import createWave from './create'
import translate from './translate'
import {graphMapping, textMapping, otherMapping} from './mapping'

// 根据配置更新一个图表
function updateWave({tabId, layerId, option, value, schema, instance}) {
  const target = instance.layer.find(({id}) => id === layerId)
  const layer = target.instance
  try {
    // 图形配置面板
    if (tabId === 'graph') {
      const graphResult = graphMapping(value)
      layer.setData(null, {nice: graphResult.scale})
      layer.setStyle({[option]: graphResult.style})
    }
    // 文字配置面板
    if (tabId === 'text') {
      const textResult = textMapping(value)
      layer.setStyle({[option]: textResult})
    }
    // 其他面板
    if (tabId === 'other') {
      const otherResult = otherMapping(target.type, value)
      // options 更新的时候当前图层重新初始化
      if (Object.keys(otherResult.options).length !== 0) {
        while (instance.layer.length !== 0) {
          instance.layer[0].instance.destroy()
        }
        createWave(translate(schema), instance)
        return
      }
      layer.setStyle(otherResult.style)
    }
    // 当前图层重新渲染
    layer.draw()
  } catch (error) {
    console.error('图层配置解析错误，更新失败', error)
  }
}
  
export default updateWave
