'use strict';
(function (G) {
  // Content access flag only. No launcher, debug window, or resource tools.
  // Set false before release to restore normal limits and the original save.
  G.Development = { enabled: false };
})(EditorGame);
