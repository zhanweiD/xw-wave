export default () => `[
  // 页面左侧图标选择菜单即是本组件
  {
    type: 'tabMenu',
    options: {
      id: 'tabMenu',
      layout: 'main',
    },
    data: {
      name: 'root',
      children: [
        {
          name: '区域一',
          children: [
            {
              name: '集团A',
              children: [
                {
                  name: '矿场A',
                },
                {
                  name: '矿场B',
                },
              ],
            },
            {
              name: '集团B',
              children: [
                {
                  name: '矿场C',
                },
                {
                  name: '矿场D',
                },
              ],
            },
          ],
        },
        {
          name: '区域二',
          children: [
            {
              name: '集团C',
              children: [
                {
                  name: '矿场E',
                },
                {
                  name: '矿场F',
                },
              ],
            },
            {
              name: '集团D',
              children: [
                {
                  name: '矿场G',
                },
                {
                  name: '矿场H',
                },
              ],
            },
          ],
        },
      ],
    },
    style: {
      text: {
        height: '30px',
        width: ['auto', 'auto', '120px'],
        padding: '5px',
        margin: ['', '', '10px'],
      },
      group: {
        width: ['100px', '150px', '450px'],
        backgroundColor: '#ffffff11',
        borderRight: ['solid 0.5px #dddddd33', 'solid 0.5px #dddddd33', ''],
        flexDirection: ['column', 'column', 'row'],
        justifyContent: ['', '', ''],
        flexWrap: ['', '', 'wrap'],
      },
    },
  },
]`
