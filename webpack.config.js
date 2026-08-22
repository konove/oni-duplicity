// @ts-check
"use strict";
const path = require("path");

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

/** @type {import("webpack").Configuration} */
const config = {
  mode: isDev ? "development" : "production",

  devtool: isDev ? "eval-source-map" : "source-map",

  cache: {
    type: "filesystem",
  },

  devServer: {
    static: {
      directory: PATHS.appPublic,
    },
    hot: isDev,
    port: 8080,
  },

  entry: {
    client: path.join(PATHS.appSrc, "./index.tsx"),
  },

  output: {
    filename: "[name].[contenthash].bundle.js",
    chunkFilename: "[name].[contenthash].chunk.js",
    path: PATHS.appDist,
    publicPath,
    clean: true,
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
      // oni-save-parser is a fork we maintain and where the binary-format
      // bugs live. Its maps embed the TypeScript, so a stack trace out of a
      // failed parse resolves to parser source instead of bundled output.
      // Scoped to that one package on purpose: most dependencies ship no maps
      // at all, and a blanket rule warns once per file for each of them.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
        include: [path.resolve(PATHS.nodeModules, "oni-save-parser")],
      },

      {
        test: /\.tsx?$/,
        include: [PATHS.appSrc],
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(PATHS.appSrc, "tsconfig.json"),
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
    // exercised via `npm start` - there is no /service-worker.js to register.
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
        // Named groups rather than a chunk per package. Per-package naming
        // silently collided with webpack's own defaults - `maxInitialRequests`
        // (30) and `minSize` (20000) - so only the packages that happened to be
        // large enough won a chunk and the rest pooled into an anonymous one.
        // Which packages fell on which side moved with their sizes, so an
        // unrelated dependency bump reshuffled the pool and invalidated it for
        // everyone. These boundaries are fixed instead.

        // Versioned on its own schedule, and the only dependency the worker
        // needs.
        parser: {
          test: /[\\/]node_modules[\\/](oni-save-parser|pako|text-encoding|jsonschema)[\\/]/,
          name: "npm.save-parser",
          priority: 30,
        },

        // Emotion is MUI's styling engine, so the two always move together.
        ui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion|@base-ui|stylis)[\\/]/,
          name: "npm.ui",
          priority: 20,
        },

        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|react-redux|redux|redux-saga|@redux-saga)[\\/]/,
          name: "npm.framework",
          priority: 10,
        },

        npm: {
          test: /[\\/]node_modules[\\/]/,
          name: "npm.vendor",
          priority: 0,
        },
      },
    },
  },

  performance: {
    // This is a save editor; the parser bundle is inherently chunky.
    hints: false,
  },
};

module.exports = config;
