const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    main: './src/main.js',
  },
  output: {
    libraryTarget: 'umd',
    filename: 'wave.min.js',
    path: path.resolve(__dirname, '../dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-optional-chaining',
            ],
          },
        },
      },
    ],
  },
  externals: [
    'animejs',
    'chroma-js',
    'd3',
    'fabric',
    'heatmap.js',
    'lodash',
  ],
}
