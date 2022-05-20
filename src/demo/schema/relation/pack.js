export default () => `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '打包图',
    style: {
      text: {
        fontSize: 16,
      },
    },
  },
  {
    type: 'pack',
    options: {
      id: 'pack',
      layout: 'main',
      zoom: true,
    },
    data: ${nodes},
    style: {},
    animation: {
      circle: {
        updateAnimation: {},
      },
    },
  },
]`

const nodes = `[
  ['id', 'name', 'value', 'to'],
  ['sa', '学校A', 0, ['sa-g1','sa-g2']],
  ['sb', '学校B', 0,['sb-g1','sb-g2','sb-g3']],
  ['sa-g1', '一年级', 0,['s1', 's2']],
  ['sa-g2', '二年级', 0,['s3','s4']],
  ['sb-g1', '一年级', 0,['s5']],
  ['sb-g2', '二年级', 0,['s6']],
  ['sb-g3', '三年级', 0,['s7','s8','s8']],
  ['s1', '学生1', 22,[]],
  ['s2', '学生2', 22,[]],
  ['s3', '学生3', 22,[]],
  ['s4', '学生4', 22,[]],
  ['s5', '学生5', 22,[]],
  ['s6', '学生6', 22,[]],
  ['s7', '学生7', 22,[]],
  ['s8', '学生8', 22,[]],
  ['s9', '学生9', 22,[]],
]`
