var express = require('express');
var router = express.Router();
var History_rooms = require('../models/history_rooms');

router.get('/data', async function (req, res) {
  try {
    let data = await History_rooms.find()

    res.send({ status: 'success', message: 'success', data: data })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/search', async function (req, res) {
  try {
    let data = await History_rooms.find({ meeting_id: req.body.meeting_id })
    if (data == '') {
      res.send({ status: 'success', message: 'success', data: "NoData" })
    } else {
      res.send({ status: 'success', message: 'success', data: data })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

module.exports = router;