const webpack = require('webpack')
const path = require('path')

const buildPath = path.resolve(__dirname, 'dist')

const server = {
	context: __dirname,
	entry: './src/server/server.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: ['ts-loader'],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'server.js',
		path: path.resolve(buildPath, 'server'),
	},
	target: 'node',
}

const client = {
	context: __dirname,
	entry: './src/client/client.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: ['ts-loader'],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'client.js',
		path: path.resolve(buildPath, 'client'),
	},
}

module.exports = [server, client]
