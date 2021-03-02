var express = require('express');
var router = express.Router();
var removes = require('../models/remove');
var Users = require('../models/users');
var Sessionroom = require('../models/session_room');
var Sessionuser = require('../models/session_user');
var rooms = require('../models/rooms')
var onebox = require('../service/onebox')
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

router.get('/data', async function (req, res) {
    try {
        let data = await removes.find()
        res.send({ status: 'success', message: 'Data', data: data })
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

router.post('/search', async function (req, res) {
    try {
        let search = await removes.findOne({ username: req.body.username, email: req.body.email })
        // res.send({ status: 'success', message: 'Data search', data: search })
        if (search != null) {
            res.send({ status: 'OK', message: 'success', data: search })
        } else {
            res.send({ status: 'Fail', message: 'error', data: search })
        }
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

router.post('/restore', async function (req, res) {
    try {
        let re_data = await removes.findOne({ username: req.body.username, email: req.body.email })
        let user = new Users({
            _id: ObjectId(re_data._id),
            username: re_data.username,
            email: re_data.email,
            name: re_data.name,
            lastname: re_data.lastname,
            phonenumber: re_data.phonenumber,
            company: re_data.company,
            oneid: re_data.oneid,
            room_id: re_data.room_id,
            role: re_data.role,
            avatar_profile: re_data.avatar_profile,
            verifyemail: re_data.verifyemail,
            license: re_data.license,
            limit: re_data.limit,
            created_at: re_data.created_at,
            updated_at: re_data.updated_at,
            __v: re_data.__v,
        })
        await re_data.delete()
        await user.save()
        res.send({ status: 'success', message: 'OK' })
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

router.post('/delete', async function (req, res) {
    try {
        let del = await removes.findOne({ username: req.body.username, email: req.body.email })
        let ssr = await Sessionroom.findOne({ oneid: del.oneid })
        let ssu = await Sessionuser.findOne({ user_id: del._id })
        let room = await rooms.findOne({ user_id: del._id })
        let oneb = await onebox.findOne({ oneid: del.oneid })

        if (del) {
            await del.delete()
            if (ssr) {
                await ssr.delete()
            }
            if (ssu) {
                await ssu.delete()
            }
            if (room) {
                await room.delete()
            }
            if (oneb) {
                await oneb.delete()
            }
            res.send({ status: 'OK', message: 'delete success' })
        } else {
            res.send({ status: 'error', message: 'Not data' })
        }
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

router.post('/save', async function (req, res) {
    try {
        let user = await Users.findOne({ username: req.body.username, email: req.body.email })
        let data = new removes({
            _id: ObjectId(user._id),
            username: user.username,
            email: user.email,
            name: user.name,
            lastname: user.lastname,
            phonenumber: user.phonenumber,
            company: user.company,
            oneid: user.oneid,
            room_id: user.room_id,
            role: user.role,
            avatar_profile: user.avatar_profile,
            verifyemail: user.verifyemail,
            license: user.license,
            limit: user.limit,
            created_at: user.created_at,
            updated_at: user.updated_at,
            __v: user.__v,
        })
        await user.delete()
        await data.save()
        res.send({ status: 'success', message: 'OK' })
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});
module.exports = router;