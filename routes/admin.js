var express = require('express');
var router = express.Router();
var admin = require('../models/admin');
var md5 = require('md5');

router.post('/create', async function (req, res) {
    try {
        let data = new admin({
            user: req.body.user,
            password: md5(req.body.password),
            created_at: Date.now(),
        })

        await data.save()
        res.send({ status: 'success', message: 'create role success', data: data })
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

router.post('/login', async function (req, res) {
    try {
        let data = await admin.findOne({ user: req.body.user, password: md5(req.body.password), })
        if (data != null) {
            res.send({ status: 'OK', message: 'success', data: data })
        } else {
            res.send({ status: 'Fail', message: 'error', data: data })
        }
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});
module.exports = router;