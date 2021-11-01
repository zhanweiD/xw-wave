export default () => `[
  // 标题文字图层
  {
    type: 'indicator',
    options: {
      id: 'indicator',
      layout: 'main',
    },
    data: [
      ['跨境电商交易额'],
      [
        {
          text: '82828',
          fontSize: '30px',
          color: 'skyblue',
          shadow: '2px 2px 2px gray',
          fontWeight: 900,
          paddingRight: '30px',
          event: {
            click: d => console.log(d),
          },
        },
        {
          text: '万元',
          fontSize: '12px',
        },
      ],
      'text',
    ],
    style: {
      text: {
        fontSize: '16px',
        color: 'lightgray',
      },
      group: {
        backgroundColor: ['yellow', 'black', 'blue'],
      },
      icon: {
        src: 'https://img0.baidu.com/it/u=3808236042,1207888271&fm=26&fmt=auto',
        width: 50,
        height: 50,
      },
    },
  },
]`
