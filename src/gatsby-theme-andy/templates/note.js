import React from 'react';
import { graphql } from 'gatsby';
import BrainNoteContainer from 'gatsby-theme-andy/src/components/BrainNoteContainer';

export default (props) => {
  return (
    <BrainNoteContainer
      note={props.data.brainNote}
      location={props.location}
      slug={props.pageContext.slug}
      siteMetadata={props.data.site.siteMetadata}
    />
  );
};

export const query = graphql`
  query BrainNoteWithRefsBySlug_($slug: String!) {
    brainNote(slug: { eq: $slug }) {
      slug
      title
      childMdx {
        body
      }
      inboundReferenceNotes {
        title
        slug
        childMdx {
          excerpt(pruneLength: 280, truncate: true)
        }
      }
      outboundReferenceNotes {
        title
        slug
        childMdx {
          excerpt(pruneLength: 280, truncate: true)
        }
      }
    }
    site {
      siteMetadata {
        title
      }
    }
  }
`;
