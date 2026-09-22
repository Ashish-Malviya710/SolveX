// TODO: verify req.user is the Problem Provider, Project Leader, or a Team Member
// of the project referenced in the request (params.projectId / body.projectId)
// before allowing access to project details, chat, structure, etc.

module.exports = function projectAccess(req, res, next) {
  next();
};
