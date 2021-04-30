import isFunction from 'lodash/isFunction'
import random from './random'
import createLog from './create-log'
import isDef from './is-def'

const log = createLog(__filename)

const createEvent = (privateName = '') => {
  const id = `__event-${privateName}-${random()}`
  const rename = name => `${id}-${name}`
  let cache = {}

  const event = {

    on(name, fn, remark) {
      if (typeof name === 'string' && typeof fn === 'function') {
        const prefixedName = rename(name)
        cache[prefixedName] = cache[prefixedName] || []
        fn.remark = remark
        cache[prefixedName].push(fn)
      }
    },

    once(name, fn, remark) {
      if (typeof name === 'string' && typeof fn === 'function') {
        const prefixedName = rename(name)
        cache[prefixedName] = cache[prefixedName] || []
        fn.remark = remark
        fn.isOnceDone = false
        cache[prefixedName].push(fn)
      }
    },

    off(name, fn) {
      const prefixedName = rename(name)
      if (!fn) {
        delete cache[prefixedName]
      } else {
        const fns = cache[prefixedName] || []
        fns.splice(fns.indexOf(fn), 1)
        if (!fns.length) {
          delete cache[prefixedName]
        }
      }
    },

    fire(name, args, context) {
      const fns = cache[rename(name)]
      if (fns) {
        let fn
        for (let i = 0, l = fns.length; i < l; i++) {
          fn = fns[i]
          if (!isDef(fn.isOnceDone)) {
            fn.apply(context || null, [].concat(args))
          } else if (fn.isOnceDone === false) {
            fn.apply(context || null, [].concat(args))
            fn.isOnceDone = true
          }
        }
      }
    },

    has(name) {
      return !!cache[rename(name)]
    },

    // 清空所有事件
    clear() {
      cache = {}
    },
  }

  return event
}

// const v = createEvent()
// const vf = () => {
//   console.log('🏓 vf1')
// }
// v.once('ready', vf)
// const vf2 = () => {
//   console.log('🏓 vf2')
// }
// v.once('ready', vf2)

// v.fire('ready')
// v.fire('ready')
// v.fire('ready')

// window.addEventListener('blur', ()=>{
//   document.title = '放入后台';
// }, true);

// window.addEventListener('focus', ()=>{
//   document.title = '进入页面';
// }, true);

export default createEvent

export const assignEvent = receiver => {
  log.warn('assignEvent方法将会删除，应改为createEvent实现')
  Object.assign(receiver, createEvent())
}

export const globalEvent = createEvent()

document.body.addEventListener('click', e => {
  if (e.target && e.target.closest('.stopPropagation') === null) {
    globalEvent.fire('globalClick', e)
  }
})

window.addEventListener('resize', e => {
  globalEvent.fire('globalResize', e)
})

const keyDownPrefix = keyName => `keyDown-${keyName}`
const keyUpPrefix = keyName => `keyUp-${keyName}`

// 是否处于输入状态
const isInputting = () => {
  const {activeElement} = document
  return (activeElement && (activeElement.nodeName === 'TEXTAREA' || activeElement.nodeName === 'INPUT'))
}

const isFnKeyHolding = () => {
  const {event: e} = window
  return (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
}

// 示例：
// shortcut.add({
//   keyName: 'commandS',
//   keyDown: () => {
//     if (isFunction(self.activeTab.save)) {
//       self.activeTab.save()
//     }
//   },
//   keyUp: () => {},
//   remark: 'some text',
// })
const shortcutEvent = createEvent()

shortcutEvent.fireSingleKey = name => {
  if (!isFnKeyHolding() && isInputting()) {
    return
  }
  shortcutEvent.fire(name)
}

export const shortcut = {
  init() {
    // 功能键  metaKey = mac command ,  ctrlKey = win ctrl
    const keyDownFunction = e => {
      switch (e.keyCode) {
        // backspace 退格键
        case 8:
          shortcutEvent.fire(keyDownPrefix('backspace'))
          break
        // Tab 按下时阻止默认行为，抬起时执行tab事件
        // case 9:
        //   e.preventDefault()
        //   break
        // Shift
        case 16:
          document.body.classList.add('noselect')
          break
        // 苹果上的option
        // TODO window的alt待验证
        case 18:
          shortcut.option = true
          shortcutEvent.fire(keyDownPrefix('option'))
          break
        // 空格
        case 32:
          shortcut.space = true
          shortcutEvent.fireSingleKey(keyDownPrefix('space'))
          break
        // 删除键
        case 46:
          shortcutEvent.fire(keyDownPrefix('delete'))
          break
        // K
        case 75:
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            shortcutEvent.fire(keyDownPrefix('commandK'))
          }
          break
        // Command+S
        // Mac系统是Command+S，Window系统是Ctrl+S
        // NOTE 两个系统不一样，统一使用Mac系统的写法
        case 83:
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            shortcutEvent.fire(keyDownPrefix('commandS'))
          }
          break
        // commandZ / commandShiftZ
        case 90:
          if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
            e.preventDefault()
            shortcutEvent.fire(keyDownPrefix('commandShiftZ'))
          } else if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            shortcutEvent.fire(keyDownPrefix('commandZ'))
          }
          break
        default:
          break
      }
    }

    // !NOTE 这里不能使用节流，否则浏览器的默认行为的无法拦截的
    document.addEventListener('keydown', e => {
      keyDownFunction(e)
    })

    document.addEventListener('keyup', e => {
      switch (e.keyCode) {
        // backspace 退格键
        case 8:
          shortcutEvent.fire(keyUpPrefix('backspace'))
          break
        // Tab
        // case 9:
        //   if (self.editor.isArtTabActive) {
        //     self.editor.activeTab.zoomToView()
        //   }
        //   break
        // Shift
        case 16:
          document.body.classList.remove('noselect')
          break
        // 苹果上的option
        // TODO window的alt待验证
        case 18:
          shortcut.option = false
          shortcutEvent.fire(keyUpPrefix('option'))
          break
        // 空格
        case 32:
          shortcut.space = false
          shortcutEvent.fireSingleKey(keyUpPrefix('space'))
          break
        // 删除键
        case 46:
          shortcutEvent.fire(keyUpPrefix('delete'))
          break
        // A
        case 65:
          shortcutEvent.fireSingleKey(keyUpPrefix('a'))
          break
        // B
        case 66:
          shortcutEvent.fireSingleKey(keyUpPrefix('b'))
          break
        // M
        case 77:
          shortcutEvent.fireSingleKey(keyUpPrefix('m'))
          break
        // N
        case 78:
          shortcutEvent.fireSingleKey(keyUpPrefix('n'))
          break
        // V
        case 86:
          shortcutEvent.fireSingleKey(keyUpPrefix('v'))
          break
        // ESC
        case 27:
          shortcutEvent.fireSingleKey(keyUpPrefix('ESC'))
          break
        // 上
        case 38:
          shortcutEvent.fireSingleKey(keyUpPrefix('Top'))
          e.shiftKey && shortcutEvent.fireSingleKey(keyUpPrefix('ShiftTop'))
          break
        // 右
        case 39:
          shortcutEvent.fireSingleKey(keyUpPrefix('Right'))
          e.shiftKey && shortcutEvent.fireSingleKey(keyUpPrefix('ShiftRight'))
          break
        // 下
        case 40:
          shortcutEvent.fireSingleKey(keyUpPrefix('Down'))
          e.shiftKey && shortcutEvent.fireSingleKey(keyUpPrefix('ShiftDown'))
          break
        // 左
        case 37:
          shortcutEvent.fireSingleKey(keyUpPrefix('Left'))
          e.shiftKey && shortcutEvent.fireSingleKey(keyUpPrefix('ShiftLeft'))
          break
        // Delete
        // case 46:
        //   self.set('deleteKeyState', e)
        //   break
        // Backspace
        // case 8:
        //   self.set('backSpaceKeyState', e)
        //   break
        default:
          break
      }
    })
  },
  // 注册鼠标事件，并返回撤销事件的方法
  add({keyName, keyDown, keyUp, remark}) {
    const offs = []

    if (isFunction(keyDown)) {
      shortcutEvent.on(keyDownPrefix(keyName), keyDown, remark)
      offs.push(() => {
        shortcutEvent.off(keyDownPrefix(keyName), keyDown)
      })
    }

    if (isFunction(keyUp)) {
      shortcutEvent.on(keyUpPrefix(keyName), keyUp, remark)
      offs.push(() => {
        shortcutEvent.off(keyUpPrefix(keyName), keyUp)
      })
    }

    return () => {
      offs.forEach(off => {
        off()
      })
    }
  },
}

shortcut.init()
