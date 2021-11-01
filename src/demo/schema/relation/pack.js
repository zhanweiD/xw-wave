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
    data: [${nodes}, ${links}],
    style: {},
    animation: {
      circle: {
        updateAnimation: {},
      },
    },
  },
]`

const nodes = `[
  ['id', 'name', 'value'],
  ['sa', '学校A', 0],
  ['sb', '学校B', 0],
  ['sa-g1', '一年级', 0],
  ['sa-g2', '二年级', 0],
  ['sb-g1', '一年级', 0],
  ['sb-g2', '二年级', 0],
  ['sb-g3', '三年级', 0],
  ['s1', '学生1', 22],
  ['s2', '学生2', 22],
  ['s3', '学生3', 22],
  ['s4', '学生4', 22],
  ['s5', '学生5', 22],
  ['s6', '学生6', 22],
  ['s7', '学生7', 22],
  ['s8', '学生8', 22],
  ['s9', '学生9', 22],
]`

const links = `[
  ['from', 'to'],
  ['sa', 'sa-g1'],
  ['sa', 'sa-g2'],
  ['sb', 'sb-g1'],
  ['sb', 'sb-g2'],
  ['sb', 'sb-g3'],
  ['sa-g1', 's1'],
  ['sa-g1', 's2'],
  ['sa-g2', 's3'],
  ['sa-g2', 's4'],
  ['sb-g1', 's5'],
  ['sb-g2', 's6'],
  ['sb-g3', 's7'],
  ['sb-g3', 's8'],
  ['sb-g3', 's9'],
]`
