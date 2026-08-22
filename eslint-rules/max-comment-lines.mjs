const MAX_LINES = 2;

const DIRECTIVE =
  /^\s*(?:eslint-|@ts-|prettier-|global\s|globals\s|jsx\s|@jsx|type-coverage:|v8 ignore|c8 ignore|istanbul )/;

function contentLines(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trim())
    .filter(Boolean);
}

function isDirective(comment) {
  return DIRECTIVE.test(comment.value);
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: `Reject comments longer than ${MAX_LINES} lines` },
    schema: [],
    messages: {
      tooLong:
        'Comment is {{count}} lines; the limit is {{max}}. Delete it, or cut it to the one thing the code cannot say itself.'
    }
  },
  create(context) {
    const source = context.sourceCode ?? context.getSourceCode();

    function report(node, count) {
      context.report({ node, messageId: 'tooLong', data: { count, max: MAX_LINES } });
    }

    return {
      Program() {
        const comments = source.getAllComments().filter((c) => !isDirective(c));

        for (const comment of comments) {
          if (comment.type !== 'Block') continue;
          const count = contentLines(comment.value).length;
          if (count > MAX_LINES) report(comment, count);
        }

        // Stacked `//` lines read as one comment, so they are counted as one.
        let run = [];
        const flush = () => {
          const count = run.reduce((total, c) => total + contentLines(c.value).length, 0);
          if (count > MAX_LINES) report(run[0], count);
          run = [];
        };

        for (const comment of comments) {
          if (comment.type !== 'Line') {
            flush();
            continue;
          }
          const previous = run[run.length - 1];
          if (previous && comment.loc.start.line !== previous.loc.end.line + 1) flush();
          run.push(comment);
        }
        flush();
      }
    };
  }
};
