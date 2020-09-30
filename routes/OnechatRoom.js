var express = require('express');
var router = express.Router();
const sha1 = require('sha1')
var roomonechat = require('../models/session_roomonechat')
var roomonecon = require('../models/session_room')
const auth = require('../service/auth_onechat')
// const sercretkey = 'ONECHATSERVICE'
// a[0].conference.oe.authEnabled
router.post('/create',async function(req, res , next) {
  let data = req.body
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1] 
    if(auth(tokenkey)){ 
      let meetingid = sha1(data.roomname) + '-' + Date.now()
      let url = process.env.ONECHAT_ROOM_DOMAIN + meetingid + '?onechat?0nechat@inet!?' + data.name + '?' + data.option + '?' + data.roomname + '?onechat' 
      let key = sha1(meetingid + data.name)
      let session = new roomonechat({
          hostname : data.name,
          roomname : data.roomname,
          urlroom : url,
          keyroom : key,
          member : [{name : data.name , join_at : Date.now()}],
          meeting_id : meetingid,
          created_at : Date.now(),
          })
      await session.save()
      res.status(200).send({
        data:{
          urlroom : url,
          meetingid : meetingid,
          key: key,
          option: data.option,
          created_at: Date.now()},
        events: 'CreateRoom',
        status: 'Success'
      })
    }else{
      res.send({
        status : 'AuthError',
        error :  'SecretKey-Wrong' 
      })
    } 
  } catch (error) {
    console.log(error)
    next(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
  
})

router.post('/join',async function(req, res , next) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1] 
    if(auth(tokenkey)){ 
      let data = req.body
      let url = process.env.ONECHAT_ROOM_DOMAIN + data.meetingid + '?attendee?' + data.name + '?' + data.key + '?' + data.option
      let roomdata = await roomonechat.findOne({ meeting_id: data.meetingid})
      console.log(roomdata)
      url = url + '?' + roomdata.roomname
      if(roomdata.keyroom !== data.key){
        res.send({status:'ERROR' , error: 'WrongKey'})
      }
      roomdata.member.push({ name: data.name , join_at: Date.now()})
      res.status(200).send({
        data:{
          urlroom : url,
          name_join: data.name,
          meetingid : data.meetingid,
          join_at: Date.now(),
          option : data.option
        },
      events: 'JoinRoom',
      status: 'Success'
     })
    }else{
      res.send({
        status : 'AuthError',
        error :  'SecretKey-Wrong' 
      })
    } 
  }catch (error) {
    console.log(error)
    next(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
})

router.post('/checkKey' , async function(req , res) {
  try {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods','POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers','Content-Type, Option, Authorization')
    
    let meetingid = req.body.meetingid
    console.log(meetingid)
    let roomdata
    if(req.body.clientname == 'onechat'){
       roomdata = await roomonechat.findOne({ meeting_id: meetingid})
       console.log(roomdata)
      //  res.send(roomdata.keyroom)
      res.send({key: roomdata.keyroom })
    }else{
       roomdata = await roomonecon.findOne({ meeting_id: meetingid})
       console.log(roomdata)
      //  res.send(roomdata.key)
        console.log('url____________' , roomdata.urlInvite)
      res.send({key: roomdata.key , urlInvite: roomdata.urlInvite})
    }
    
  } catch (error) {
    console.log(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
})
module.exports = router;
