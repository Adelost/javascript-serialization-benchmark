module.exports = {
  entry: './src/index.ts',
  target: 'node',
  mode: 'production',
  // mode: 'development',
  // devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  node: false,
  output: {
    filename: 'index.js',
    path: `${__dirname}/minified`,
  },
};
