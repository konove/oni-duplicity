"use strict";
const path = require("path");

const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

const isDev = process.env["NODE_ENV"] === "development";

const root = path.resolve(__dirname);

const PATHS = {
  appPackageJson: path.resolve(root, "package.json"),
  appSrc: path.resolve(root, "./src"),
  appPublic: path.resolve(root, "./public"),
  appDist: path.resolve(root, "./dist"),
  nodeModules: path.resolve(root, "./node_modules"),
  changelog: path.resolve(root, "./CHANGELOG.md"),
};

const { friendlyName, description } = require(PATHS.appPackageJson);

const PUBLIC_URL_PATH = "/oni-duplicity/";
const publicPath = isDev ? "/" : PUBLIC_URL_PATH;

console.log("Webpack build", isDev ? "[development]" : "[production]");

module.exports = {
  mode: isDev ? "development" : "production",

  devtool: isDev ? "eval-source-map" : "source-map",

  devServer: {
    static: {
      directory: PATHS.appPublic,
    },
    hot: isDev,
    historyApiFallback: true,
    port: 8080,
  },

  entry: {
    client: [path.join(PATHS.appSrc, "./index.tsx")],
  },

  output: {
    filename: "[name].[contenthash].bundle.js",
    chunkFilename: "[name].[contenthash].chunk.js",
    assetModuleFilename: "assets/[hash][ext][query]",
    path: PATHS.appDist,
    publicPath,
    clean: true,

    // Fix hot-reload interfering with web workers
    globalObject: "self",
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "@": PATHS.appSrc,
      "@changelog": PATHS.changelog,
    },
  },

  module: {
    rules: [
      // Process source maps in input sources.
      {
        enforce: "pre",
        test: /\.(jsx?|tsx?)$/,
        loader: "source-map-loader",
        include: [PATHS.appSrc],
      },

      {
        test: /\.tsx?$/,
        include: [PATHS.appSrc],
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(PATHS.appSrc, "tsconfig.json"),
              transpileOnly: false,
            },
          },
        ],
      },

      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },

      // Asset modules replace file-loader / url-loader / raw-loader.
      {
        test: /\.(woff|woff2)$/,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 5000,
          },
        },
        generator: {
          filename: "fonts/[hash][ext][query]",
        },
      },
      {
        test: /\.(ttf|eot|svg)$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[hash][ext][query]",
        },
      },
      {
        test: /\.png$/,
        type: "asset/resource",
        generator: {
          filename: "images/[hash][ext][query]",
        },
      },
      {
        test: /\.(txt|md)$/,
        type: "asset/source",
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        isDev ? "development" : "production"
      ),
    }),

    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(PATHS.appSrc, "index.ejs"),
      templateParameters: {
        publicPath,
        friendlyName,
        description,
      },
    }),

    new CopyWebpackPlugin({
      patterns: [{ from: PATHS.appPublic, to: PATHS.appDist }],
    }),

    // Production only. GenerateSW warns on every rebuild under --watch, and
    // webpack-dev-server renders warnings as a full-screen overlay.
    // Consequence: the Settings page's "Enable Offline Mode" toggle cannot be
    // exercised via `npm start` (no /service-worker.js to register, and
    // historyApiFallback serves index.html instead, failing the MIME check).
    // Use `npm run build` and serve dist/ to test offline mode.
    ...(isDev
      ? []
      : [
          new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            // The save-parser worker chunk is large; don't silently drop it.
            maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          }),
        ]),
  ],

  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        npm: {
          test: /[\\/]node_modules[\\/]/,
          name(mod) {
            if (!mod.context) {
              return "npm.vendor";
            }
            const relToModule = path.relative(PATHS.nodeModules, mod.context);
            const [scopeOrName, maybeName] = relToModule.split(path.sep);
            const moduleName = scopeOrName.startsWith("@")
              ? `${scopeOrName}-${maybeName}`
              : scopeOrName;
            // Sanitise for use as a filename.
            return `npm.${String(moduleName).replace(/[^a-z0-9_-]/gi, "-")}`;
          },
        },
      },
    },
  },

  performance: {
    // This is a save editor; the parser bundle is inherently chunky.
    hints: false,
  },
};
