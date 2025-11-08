const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node',
    mode: 'none',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'out'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        // Fallback for modules that might not resolve properly
        fallback: {
            'jiti': false,
            'jiti/package.json': false
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    optimization: {
        splitChunks: false,
        runtimeChunk: false
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: 'log',
    },
};

module.exports = config;
