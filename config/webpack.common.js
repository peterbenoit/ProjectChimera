const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: {
		serviceWorker: './src/background/serviceWorker.js',
		content: './src/content/content-script.js',
		sidepanel: './src/sidepanel/js/main.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, '../dist'),
		clean: true
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			}
		]
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{
					from: 'src/manifest.json',
					to: 'manifest.json'
				},
				{
					from: 'src/assets',
					to: 'assets'
				}
			]
		}),
		new HtmlWebpackPlugin({
			template: './src/sidepanel/index.html',
			filename: 'sidepanel/index.html',
			chunks: ['sidepanel']
		}),
		new MiniCssExtractPlugin({
			filename: 'sidepanel/css/[name].css'
		})
	]
};
