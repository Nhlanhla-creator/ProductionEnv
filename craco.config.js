module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and remove CSS minimizer
      webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
        (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
      );
      return webpackConfig;
    },
  },
};