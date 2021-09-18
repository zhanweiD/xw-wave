import anime from 'animejs'
import AnimationBase from './base'

const modeType = {
  SHOW: 'enlarge',
  HIDE: 'narrow',
}

const directions = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  BOTH: 'both',
}

const defaultOptions = {
  delay: 500,
  duration: 2000,
  direction: directions.HORIZONTAL,
  mode: modeType.SHOW,
  loop: false,
}

const judgeScaleValue = (mode, direction) => {
  let values = []
  const [min, max] = [0.0001, 1]
  // direction judgement
  if (direction === directions.HORIZONTAL) {
    values = mode === modeType.SHOW ? [min, max] : [max, max]
  } else if (direction === directions.VERTICAL) {
    values = mode === modeType.SHOW ? [max, min] : [max, max]
  } else if (direction === directions.BOTH) {
    values = mode === modeType.SHOW ? [min, min] : [max, max]
  }
  return values
}

export default class ZoomAnimation extends AnimationBase {
  #elementNumber = null

  constructor(options, context) {
    super(defaultOptions, options, context)
    this.#elementNumber = this.options.targets.length
  }

  play() {
    const {targets, delay, duration, mode, direction, loop} = this.options
    this.instance = anime({
      targets,
      duration: duration * 0.8,
      delay: anime.stagger(duration / this.#elementNumber / 5, {start: delay}),
      loop,
      update: this.process,
      loopBegin: this.start,
      loopComplete: this.end,
      scaleX: [
        judgeScaleValue(mode, direction)[0],
        judgeScaleValue(mode === modeType.SHOW ? modeType.HIDE : modeType.SHOW, direction)[0],
      ],
      scaleY: [
        judgeScaleValue(mode, direction)[1],
        judgeScaleValue(mode === modeType.SHOW ? modeType.HIDE : modeType.SHOW, direction)[1],
      ],
    })
  }

  destroy() {
    const {delay, duration} = this.options
    this.instance?.seek(delay + duration)
    anime.remove(this.options.targets)
  }
}
