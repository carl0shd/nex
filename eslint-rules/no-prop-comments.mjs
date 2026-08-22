// `@deprecated` is not prose — editors strike the prop through and the compiler
// reports it, so it does real work that a rename cannot.
const DIRECTIVE = /^\s*(?:eslint-|@ts-|prettier-|\*?\s*@deprecated\b)/;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Reject comments on interface and type members' },
    schema: [],
    messages: {
      propComment:
        'Do not comment a prop. Rename it, narrow its type, or split it in two — a union or a named type says more than prose.'
    }
  },
  create(context) {
    const source = context.sourceCode ?? context.getSourceCode();

    function check(node) {
      for (const comment of source.getCommentsBefore(node)) {
        if (DIRECTIVE.test(comment.value)) continue;
        context.report({ node: comment, messageId: 'propComment' });
      }
    }

    return {
      TSPropertySignature: check,
      TSMethodSignature: check,
      TSIndexSignature: check
    };
  }
};
