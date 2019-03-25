'use strict';

const frontMatter = require('front-matter');
const Prism = require('node-prismjs');
const Remarkable = require('remarkable');
const { escapeHtml } = require('remarkable/lib/common/utils');
const qs = require('qs');

const md = new Remarkable();

/**
 * Wraps the code and jsx in an html component
 * for styling it later
 * @param   {string} exampleRun Code to be run in the styleguide
 * @param   {string} exampleSrc Source that will be shown as example
 * @param   {string} langClass  CSS class for the code block
 * @returns {string}            Code block with souce and run code
 */
function codeBlockTemplate(exampleRun, exampleSrc, langClass, options) {
  const viewSource = `<div class="source">
    <pre${!langClass ? '' : ` class="${langClass}"`}><code${!langClass ? '' : ` class="${langClass}"`}>
      ${exampleSrc}
    </code></pre>
  </div>`;
  return `
<div class="example ${options.compiled ? 'exampleViewCode' : ''}">
  <div class="run">${exampleRun}</div>${!options.compiled ? viewSource : ''}
</div>`;
}

/**
 * Parse a code block to have a source and a run code
 * @param   {String}   code       - Raw html code
 * @param   {String}   lang       - Language indicated in the code block
 * @param   {String}   langPrefix - Language prefix
 * @param   {Function} highlight  - Code highlight function
 * @param   {string|null} options
 * @returns {String}                Code block with souce and run code
 */
function parseCodeBlock(code, lang, langPrefix, highlight, options) {
  let codeBlock = escapeHtml(code);

  if (highlight) {
    codeBlock = highlight(code, lang);
  }

  const langClass = !lang ? '' : `${langPrefix}${escape(lang, true)}`;
  const jsx = code;

  codeBlock = codeBlock
    .replace(/{/g, '{"{"{')
    .replace(/}/g, '{"}"}')
    .replace(/{"{"{/g, '{"{"}')
    .replace(/(\n)/g, '{"\\n"}')
    .replace(/class=/g, 'className=');

  return codeBlockTemplate(jsx, codeBlock, langClass, options ? qs.parse(options, { delimiter: ';' }) : {});
}

/**
 * @typedef MarkdownObject
 * @type {Object}
 * @property {Object} attributes - Map of properties from the front matter
 * @property {String} body       - Markdown
 */

/**
 * @typedef HTMLObject
 * @type {Object}
 * @property {String} html    - HTML parsed from markdown
 * @property {Object} imports - Map of dependencies
 */

/**
 * Parse Markdown to HTML with code blocks
 * @param   {MarkdownObject} markdown - Markdown attributes and body
 * @returns {HTMLObject}                HTML and imports
 */
function parseMarkdown(markdown) {
  return new Promise((resolve, reject) => {
    let html;

    const options = {
      highlight(code, lang) {
        const language = Prism.languages[lang] || Prism.languages.autoit;
        return Prism.highlight(code, language);
      },
      xhtmlOut: true
    };

    md.set(options);

    md.renderer.rules.fence_custom.render = (tokens, idx, opts) => {
      // gets tags applied to fence blocks ```react html
      const codeTags = tokens[idx].params.split(/\s+/g);
      return parseCodeBlock(
        tokens[idx].content,
        codeTags[codeTags.length - 1],
        opts.langPrefix,
        opts.highlight,
        codeTags.length > 2 ? codeTags[codeTags.length - 2] : null
      );
    };

    try {
      html = md.render(markdown.body);
      return resolve({ html, attributes: markdown.attributes });
    } catch (err) {
      return reject(err);
    }
  });
}

/**
 * Extract FrontMatter from markdown
 * and return a separate object with keys
 * and a markdown body
 * @param   {String} markdown - Markdown string to be parsed
 * @returns {MarkdownObject}    Markdown attributes and body
 */
function parseFrontMatter(markdown) {
  return frontMatter(markdown);
}

/**
 * Parse markdown, extract the front matter
 * and return the body and imports
 * @param  {String} markdown - Markdown string to be parsed
 * @returns {HTMLObject}       HTML and imports
 */
function parse(markdown) {
  return parseMarkdown(parseFrontMatter(markdown));
}

module.exports = {
  codeBlockTemplate,
  parse,
  parseCodeBlock,
  parseFrontMatter,
  parseMarkdown
};
