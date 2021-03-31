module.exports = {
    mode: "production",

    entry: {
        main: "./src/index.ts",
    },

    output: {
        path: `${__dirname}/dist`,
        filename: "[name].js"
    },
    module: {
        rules: [
        {
            test: /\.ts$/,
            use: "ts-loader"
        },
        {
            test: /\.(glsl|vert|frag)$/,
            loader: 'raw-loader',
            exclude: /node_modules/
          }
        ]
    },

    resolve: {
        extensions: [".ts", ".js"]
    }
};