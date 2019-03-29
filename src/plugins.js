const toSlug = require('to-slug-case');

module.exports = {
  anchors:function anchors(md) {
    md.renderer.rules.heading_open = function(tokens, idx /*, options, env */) {
      return '<h' + tokens[idx].hLevel + ' id="' + toSlug(tokens[idx+1].content) + '">';
    };

    md.renderer.rules.heading_close = function(tokens, idx /*, options, env */) {
      return '</h' + tokens[idx].hLevel + '>\n';
    };
  }
}
