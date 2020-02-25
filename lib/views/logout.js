
module.exports = function (req, res) {
  if (req.session.users !== undefined) { delete req.session.users }
  if (req.session.user !== undefined) { delete req.session.user }

  req.session.save(() => {
    res.redirect('/')
  })
}
