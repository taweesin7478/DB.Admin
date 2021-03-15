var express = require('express');
var router = express.Router();
var admin = require('../models/admin');
var md5 = require('md5');

router.get('/data', async function (req, res) {
    try {
        const tokenkey = req.headers['authorization'].split(' ')[1]
        if (tokenkey == process.env.ADMIN_TOKEN) {
            let data = await admin.find()
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

router.put('/update', async function (req, res) {
    try {
        const tokenkey = req.headers['authorization'].split(' ')[1]
        if (tokenkey == process.env.ADMIN_TOKEN) {
            let data_A = await admin.findById(req.body._id)
            data_A.No_limit = req.body.No_limit
            await data_A.save()
            res.send({ status: 'success', message: 'Data', data: data_A })
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
        const tokenkey = req.headers['authorization'].split(' ')[1]
        if (tokenkey == process.env.ADMIN_TOKEN) {
            let data = new admin({
                user: req.body.user,
                password: md5(req.body.password),
                No_limit: false,
                created_at: Date.now(),
            })
            await data.save()
            res.send({ status: 'success', message: 'create role success', data: data })
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

router.post('/login', async function (req, res) {
    try {
        const tokenkey = req.headers['authorization'].split(' ')[1]
        if (tokenkey == process.env.ADMIN_TOKEN) {
            let data = await admin.findOne({ user: req.body.user, password: md5(req.body.password), })
            if (data != null) {
                res.send({ status: 'OK', message: 'success', data: data })
            } else {
                res.send({ status: 'Fail', message: 'error', data: data })
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