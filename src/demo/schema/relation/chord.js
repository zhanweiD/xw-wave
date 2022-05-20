export default () => `[
  // 标题文字图层
  {
    type: 'text',
    options: {
      id: 'title',
      layout: 'title',
    },
    data: '和弦图',
    style: {
      text: {
        fontSize: 16,
      },
    },
  },
  {
    type: 'chord',
    options: {
      id: 'chord',
      layout: 'main',
    },
    data: [
      ['from', 'to', 'value'],
      ['row1', 'col1', [1, 2, 3, 4, 5,6 ]],
      ['row2', 'col2', [1, 2, 3, 4, 5,6 ]],
      ['row3', 'col3', [1, 2, 3, 4, 5,6 ]],
      ['row4', 'col4', [1, 2, 3, 4, 5,6 ]],
    ]       
    ,
    style: {
      labelOffset: 10,
      text: {
        fontSize: 12,
      },
      line: {
        curve: 'curveBasis',
      },
    },
  },
]`
