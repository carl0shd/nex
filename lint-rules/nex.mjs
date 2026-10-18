import maxCommentLines from "./max-comment-lines.mjs";
import noPropComments from "./no-prop-comments.mjs";

export default {
  meta: { name: "nex" },
  rules: { "max-comment-lines": maxCommentLines, "no-prop-comments": noPropComments },
};
