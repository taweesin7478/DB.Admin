var express = require('express');
var router = express.Router();
var roles = require('../models/roles');

router.get('/data', async function (req, res) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1]
    if (tokenkey == process.env.ADMIN_TOKEN) {
      let role = await roles.find()
      res.send({ status: 'success', message: 'Data roles', data: role })
    } else {
      res.send({
        status: 'AuthError',
        message: 'SecretKey-Wrong',
      })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/create', async function (req, res) {
  try {
    let data = new roles({
      name: req.body.name,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    await data.save()
    res.send({ status: 'success', message: 'create role success', data: data })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

module.exports = router;