module.exports = {
  siteMetadata: {
    title: 'Thai PDPA (unofficial)',
  },
  plugins: [
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `PDPA presented by SiData+`,
        short_name: `PDPA`,
        start_url: `/`,
        background_color: `#006400`,
        theme_color: `#006400`,
        display: `minimal-ui`,
        icon: `src/images/favicon.png`, // This path is relative to the root of the site.
      },
    },
    {
      resolve: `gatsby-theme-andy`,
      options: {
        hideDoubleBrackets: true,
      },
    },
  ],
};
