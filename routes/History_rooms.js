var express = require('express');
var router = express.Router();
var History_rooms = require('../models/history_rooms');

router.get('/data', async function (req, res) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1]
    if (tokenkey == process.env.ADMIN_TOKEN) {
      let data = await History_rooms.find()
      res.send({ status: 'success', message: 'Data', data: data })
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

router.post('/search', async function (req, res) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1]
    if (tokenkey == process.env.ADMIN_TOKEN) {
      let data = await History_rooms.find({ meeting_id: req.body.meeting_id })
      if (data == '') {
        res.send({ status: 'success', message: 'success', data: "NoData" })
      } else {
        res.send({ status: 'success', message: 'success', data: data })
      }
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

module.exports = router;