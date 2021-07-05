import createWave from './create'
import translate from './translate'
import {graphMapping, textMapping, otherMapping} from './mapping'

// 根据配置更新一个图表
function updateWave({tabId, layerId, option, value, schema, instance}) {
  const target = instance.layer.find(({id}) => id === layerId)
  const layer = target.instance
  try {
    // 图形配置面板
    tabId === 'graph' && layer.setStyle({[option]: graphMapping(value)})
    // 文字配置面板
    tabId === 'text' && layer.setStyle({[option]: textMapping(value)})
    // 其他面板
    if (tabId === 'other') {
      const result = otherMapping(target.type, value)
      // options 更新的时候当前图层重新初始化
      if (Object.keys(result.options).length !== 0) {
        while (instance.layer.length !== 0) {
          instance.layer[0].instance.destroy()
        }
        createWave(translate(schema), instance)
        return
      }
      layer.setData(null, {nice: result.scale})
      layer.setStyle(result.style)
    }
    // 由于覆盖问题，所有图层都需要重新渲染
    instance.draw()
  } catch (error) {
    console.error('图层配置解析错误，更新失败', error)
  }
}

export default updateWave
