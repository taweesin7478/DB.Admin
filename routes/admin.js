var express = require('express');
var router = express.Router();
var admin = require('../models/admin');

router.post('/create', async function (req, res) {
    try {
        let data = new admin({
            user: req.body.user,
            password: req.body.password,
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
        let data = await admin.findOne({ user: req.body.user, password: req.body.password, })
        if (data != null) {
            console.log(data)
            res.send({ status: 'OK', message: 'create role success', data: data })
        } else {
            console.log(data)
            res.send({ status: 'Fail', message: 'create role success', data: data })
        }
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});
module.exports = router;