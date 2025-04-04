const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: {
		'background/serviceWorker': './src/background/serviceWorker.js',
		'content/content-script': './src/content/content-script.js',
		'sidepanel/js/main': './src/sidepanel/js/main.js'
	},
	output: {
		path: path.resolve(__dirname, '../dist'),
		filename: '[name].js',
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
					from: './src/manifest.json',
					to: 'manifest.json'
				},
				{
					from: './src/assets',
					to: 'assets'
				},
				{
					from: './src/sidepanel/css',
					to: 'sidepanel/css'
				}
			]
		}),
		new HtmlWebpackPlugin({
			template: './src/sidepanel/index.html',
			filename: 'sidepanel/index.html',
			chunks: ['sidepanel/js/main']
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css'
		})
	]
};
