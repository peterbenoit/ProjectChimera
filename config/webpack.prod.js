const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const incrementBuild = require('./incrementBuild');

module.exports = merge(common, {
	mode: 'production',
	devtool: 'source-map',
	optimization: {
		minimize: true,
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.BUILD_NUMBER': JSON.stringify(incrementBuild),
			'process.env.NODE_ENV': JSON.stringify('production')
		})
	]
});
