import { createTocIdAssigner } from '@blog-fullstack/content-utils';
import type { Root } from 'hast';
import { headingRank } from 'hast-util-heading-rank';
import { toString } from 'hast-util-to-string';
import { visit } from 'unist-util-visit';

/** Adds heading `id`s using the same rules as {@link extractTocHeadings}. */
export function rehypeTocSlug() {
  return (tree: Root) => {
    const assignId = createTocIdAssigner();
    visit(tree, 'element', node => {
      if (!headingRank(node)) return;
      const id = assignId(toString(node));
      if (!id) return;
      node.properties ??= {};
      node.properties.id = id;
    });
  };
}
