var express = require('express');
var router = express.Router();
const Rooms = require('../models/rooms');
const Users = require('../models/users');
const Sessionroom = require('../models/session_room');
const Sessionuser = require('../models/session_user');
const Historyroom = require('../models/history_rooms')
const Votes = require('../models/votes')
const Schedulemeeting = require('../models/schedule_meeting')
const verifyToken = require('../service/verifyToken')
const jwt = require('jsonwebtoken')
const sha1 = require('sha1')
const md5 = require('md5')
const logger = require('../service/loggerfile');
const date_time = require('../service/datetime');
const { loggers } = require('winston');
const sendMail = require('../service/sendemail');
const cron = require('node-cron');
const expires = require('../service/datetime');

router.get('/data', async function (req, res) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1]
    if (tokenkey == process.env.ADMIN_TOKEN) {
      let data = await Sessionuser.find()
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

router.get('/room', async function (req, res) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1]
    if (tokenkey == process.env.ADMIN_TOKEN) {
      let data = await Rooms.find()
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

router.post('/createsession', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          let checksession = await Sessionroom.findOne({ 'user_id': authData.user._id })
          if (checksession) {
            res.send({ status: 'error', message: 'The chat room has started, Wait until the meeting is finished.' })
          } else {
            let session_room = new Sessionroom({
              user_id: authData.user._id,
              room_id: authData.room._id,
              uid: authData.room.uid,
              roomname: authData.room.name,
              name: authData.user.name,
              username: authData.user.username,
              meeting_id: `${md5(authData.room.uid + authData.user.user_id)}-${Date.now()}`,
              option: 'video',
              key: authData.room.key,
              setting: authData.room.setting,
              member: [{ email: authData.user.email, join_at: Date.now() }],
              urlInvite: ''
            })
            let historyRoom = new Historyroom({
              user_id: session_room.user_id,
              meeting_id: session_room.meeting_id,
              name: session_room.roomname,
              username: session_room.username,
              uid: session_room.uid,
              date: date_time.date(),
              start_time: date_time.time(),
              end_time: '',
              setting: authData.room.setting,
              member: [{ email: authData.user.email, join_at: Date.now() }],
            })
            session_room.urlInvite = `${process.env.domain_frontend}/join/?uuid=${session_room.uid}`
            let votes = await Votes.findOne({ 'host_id': authData.user._id, 'meetingid': '' })
            if (votes) {
              votes.roomname = session_room.roomname
              votes.meetingid = session_room.meeting_id
              await votes.save()
            }
            await historyRoom.save()
            await session_room.save()

            //  destroy session room in 24 hr
            cron.schedule(expires.sessiontimeout(), async function () {
              await Sessionroom.findOneAndDelete({ 'meeting_id': session_room.meeting_id })
              logger.info(`email: ${authData.user.email}, meetingid: ${session_room.meeting_id}, option: ${session_room.option}, message: Session room time out.`)
            });
            logger.info(`email: ${authData.user.email}, meetingid: ${session_room.meeting_id}, option: ${session_room.option}, message: Moderator start meeting room.`)
            let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
            console.log(createUrl);
            res.send({ status: 'success', message: `Moderator ${authData.user.email} Start meeting room.`, meetingid: session_room.meeting_id, url: createUrl })
          }
        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.get('/check/:uid', async function (req, res) {
  try {
    let checkuid = await Sessionroom.findOne({ 'uid': req.params.uid })
    if (checkuid) {
      if (checkuid.key == 'c21f969b5f03d33d43e04f8f136e7682')
        checkuid.key = false
      else
        checkuid.key = true
      let user = await Users.findOne({ '_id': checkuid.user_id })
      if (user) {
        res.send({ status: 'Success', message: 'Room has in session.', fullname: `${user.name} ${user.lastname}`, secretRoom: checkuid.setting.SecretRoom, key: checkuid.key })
      } else
        res.send({ status: 'Error', message: 'No user in session' })
    }
    else
      res.status(400).send({ status: 'Error', message: 'Room is not have in session.' })
  } catch (error) {
    console.log(error);
  }
})

router.post('/joinroom', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          let checksession = await Sessionroom.findOne({ 'uid': req.body.roomuid })
          let key = '', name = ''
          if (req.body.key == '')
            key = md5('default')
          else
            key = md5(req.body.key + 'inet!')

          if (req.body.name == '') {
            name = authData.user.name
          } else {
            name = req.body.name
          }

          if (checksession) {
            if (key != checksession.key) {
              logger.error(`email: ${authData.user.email}, meetingid: ${checksession.meeting_id}, message: Wrong room password`)
              res.send({ status: 'error', message: "Wrong room password." })
            } else {
              let joinUrl = `${process.env.domain_conference}${checksession.meeting_id}?attendee?${name}?${checksession.key}?${checksession.option}?${checksession.roomname}?oneconference?${authData.user._id}`
              console.log(joinUrl);
              let member = await Sessionroom.findOne({ 'member.email': authData.user.email })
              let history = await Historyroom.findOne({ 'meeting_id': checksession.meeting_id })
              if (member) {
                logger.info(`email: ${authData.user.email}, meetingid: ${checksession.meeting_id}, message: Attendee join room meeting again.`)
                res.send({ status: 'success', message: `Attendee ${authData.user.email} join meeting room`, url: joinUrl })
              }
              else {
                checksession.member.push({ email: authData.user.email, join_at: Date.now() })
                history.member = checksession.member
                history.attendee = (checksession.member).length
                await checksession.save()
                await history.save()
                logger.info(`email: ${authData.user.email}, meetingid: ${checksession.meeting_id}, message: Attendee join room meeting.`)
                res.send({ status: 'success', message: `Attendee ${authData.user.email} join meeting room`, url: joinUrl })
              }
            }
          } else
            res.send({ status: 'error', message: "The meeting hasn't started yet." })
        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.post('/schedulemeeting', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          let user = await Users.findOne({ 'email': authData.user.email })
          if (user) {
            let date = new Date(req.body.date)
            let schedule = new Schedulemeeting({
              user_id: authData.user._id,
              meeting_id: `${md5(authData.room.uid + authData.user.user_id)}-${Date.now()}`,
              name: req.body.subject,
              email: authData.user.email,
              username: authData.user.username,
              uid: authData.room.uid,
              date: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
              start_time: req.body.time,
              end_time: date_time.addminutes(req.body.date, req.body.time, req.body.duration),
              option: 'video',
              key: '',
              setting: '',
            })
            if (req.body.key == '')
              schedule.key = md5('default')
            else
              schedule.key = md5(req.body.key + 'inet!')

            let setting = settingroom(req.body.option1, req.body.option2, req.body.option3, req.body.option4, req.body.option5)
            var option = {
              'MuteUserJoin': setting[0],
              'ModeratorApproveBeforeJoin': setting[1],
              'AllowAnyUserStartMeeting': setting[2],
              'AllUserJoinAsModerator': setting[3],
              'SecretRoom': setting[4]
            };
            schedule.setting = option
            await schedule.save()
            logger.info(`email: ${user.email}, message: Create schedule meeting Successfully`)
            res.send({ status: 'success', message: 'Create schedule meeting Successfully.', data: schedule })
          }
        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
  }
})

router.post('/startschedule', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          let schedule = await Schedulemeeting.findOne({ 'meeting_id': req.body.meetingid })
          if (schedule) {
            let date = schedule.date.split("/"),
              day = date[0],
              month = date[1]
            year = date[2]
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const starttime = Date.parse(`${day} ${monthNames[month - 1]} ${year} ${schedule.start_time}:00 GMT+0700 (Indochina Time)`);
            const endtime = Date.parse(`${day} ${monthNames[month - 1]} ${year} ${schedule.end_time}:00 GMT+0700 (Indochina Time)`);
            if (Date.now() >= starttime && Date.now() <= endtime) {
              let session_room = new Sessionroom({
                user_id: authData.user._id,
                room_id: authData.room._id,
                uid: schedule.uid,
                roomname: schedule.name,
                name: authData.user.name,
                username: schedule.username,
                meeting_id: schedule.meeting_id,
                option: 'video',
                key: schedule.key,
                setting: schedule.setting,
                member: [{ email: authData.user.email, join_at: Date.now() }],
              })

              let historyRoom = new Historyroom({
                user_id: session_room.user_id,
                meeting_id: session_room.meeting_id,
                name: session_room.roomname,
                username: session_room.username,
                uid: session_room.uid,
                date: date_time.date(),
                start_time: date_time.time(),
                end_time: '',
                setting: session_room.setting,
                member: [{ email: authData.user.email, join_at: Date.now() }],
              })
              let votes = await Votes.findOne({ 'host_id': authData.user._id, 'meetingid': '' })
              if (votes) {
                votes.roomname = session_room.roomname
                votes.meetingid = session_room.meeting_id
                await votes.save()
              }
              let del = await Sessionroom.findOne({ 'uid': schedule.uid })
              if (del) {
                await del.delete()
                await session_room.save()
                await historyRoom.save()
                let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
                logger.info(`email: ${authData.user.email},message: Start schedule meeting.`)
                console.log(createUrl);
                res.send({ status: 'success', message: `Moderator ${authData.user.email} start schedule meeting`, url: createUrl })
              } else {
                await session_room.save()
                await historyRoom.save()
                let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
                logger.info(`email: ${authData.user.email},message:Moderator start schedule meeting room.`)
                console.log(createUrl);
                res.send({ status: 'success', message: `Moderator ${authData.user.email} start schedule meeting`, url: createUrl })
              }
            } else
              res.send({ status: 'error', message: 'Wait until the day and time of use.' })
          } else {
            res.status(400).send({ status: 'error', message: 'No Schedule.' })
          }
        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.post('/getschedule', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          // let schedule = await Schedulemeeting.find({'user_id':authData.user._id})
          let schedule = await Schedulemeeting.aggregate([
            { $match: { 'user_id': authData.user._id } },
            { $sort: { created_at: -1 } },
          ])
          if (schedule) {
            res.send({ status: 'success', data: schedule })
          } else
            res.send({ status: 'error', message: 'User is has not schedule.' })
        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.put('/settingroom', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          let room = await Rooms.findOne({ 'uid': authData.room.uid })
          let user = await Users.findOne({ '_id': authData.user._id })
          if (room && user) {
            room.name = req.body.name
            if (req.body.key == '') {
              room.key = md5('default')
            } else {
              room.key = md5(req.body.key + 'inet!')
            }
            let setting = settingroom(req.body.option1, req.body.option2, req.body.option3, req.body.option4, req.body.option5)
            var option = {
              'MuteUserJoin': setting[0],
              'ModeratorApproveBeforeJoin': setting[1],
              'AllowAnyUserStartMeeting': setting[2],
              'AllUserJoinAsModerator': setting[3],
              'SecretRoom': setting[4],
              'OneboxAccountid': req.body.onebox_accountid
            };
            room.setting = option
            await room.save()
            jwt.sign({ user, room }, process.env.SECRET_TOKEN, { expiresIn: '24h' }, async (err, token) => {
              if (err) {
                res.send({ jwt: err })
              } else {
                let sessionuser = await Sessionuser.findOne({ 'email': authData.user.email })
                sessionuser.token = token
                await sessionuser.save()
                logger.info(`email: ${authData.user.email},roomuid: ${authData.room.uid}, message: Setting room success`)
                res.send({ status: 'success', message: 'Setting room success', token: token })
              }
            })
          } else
            res.send({ status: 'error', message: 'No room' })
        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.get('/history', verifyToken, async function (req, res) {
  jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
    if (err) {
      res.send({ status: 'tokenError', message: err })
    } else {
      let history = await Historyroom.find({ 'user_id': authData.user._id }).sort({ created_at: -1 })
      if (history) {
        res.send({ status: 'success', history: history })
      } else {
        res.send({ status: 'error', message: 'User does not have a history of chat rooms.' })
      }
    }
  })
})

router.post('/sharemeeting', verifyToken, async function (req, res) {
  jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
    if (err) {
      res.send({ status: 'tokenError', message: err })
    } else {
      let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
      if (sessionuser) {
        if (req.body.subject != '' && req.body.email != '') {
          let email = req.body.email.split(',')
          email.forEach(async element => {
            await sendMail.sharemeeting(req.body.subject, element, authData.room.uid)
          });
          res.send({ status: 'success', message: 'Share link meeting to email successfully.' })
        } else
          res.send({ status: 'error', message: 'Subject or Email is null.' })
      } else
        res.send({ status: 'error', message: 'Token expired' })
    }
  })
})

router.post('/checkmeetting', verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData) => {
      if (err) {
        res.send({ status: 'tokenError', message: err })
      } else {
        let sessionuser = await Sessionuser.findOne({ 'token': req.token, 'email': authData.user.email })
        if (sessionuser) {
          let session_room = await Sessionroom.findOne({ 'uid': authData.room.uid })
          if (session_room) {
            let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
            logger.info(`email: ${authData.user.email}, message: Enter the chat room again.`)
            res.send({ status: 'success', message: `Moderator ${authData.user.email} enter the chat room again`, url: createUrl })
          } else
            res.send({ status: 'error', message: 'You did not press start the room.' })

        } else
          res.send({ status: 'error', message: 'Token expired' })
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})


router.post('/logout', async function (req, res) {
  try {
    let session = await Sessionroom.findOne({ 'meeting_id': req.body.meetingid, })
    if (session) {
      let history = await Historyroom.findOne({ 'meeting_id': session.meeting_id })
      let room = await Rooms.findOne({ '_id': session.room_id })
      if (history) {
        history.end_date = date_time.date()
        history.end_time = date_time.time()
        history.member = session.member
        history.attendee = (session.member).length
        await history.save()
      } if (room) {
        room.last_session = Date.now()
        await room.save()
      }
      logger.info('user_id: ' + session.user_id + ',meetingid: ' + session.meeting_id + ' ,message: Endmeeting room session')
      session.delete()
      res.send({ status: 'success', message: 'room session logout' })
    } else {
      res.send({ status: 'error', message: 'No room in session' })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.put('/setpresenter', async function (req, res) {
  let user_id = req.body.user_id, meeting_id = req.body.meeting_id
  try {
    let checkUserid = await Users.findOne({ '_id': user_id }, 'email')
    if (checkUserid) {
      let presenter = await Sessionroom.findOne({ 'meeting_id': meeting_id }, 'presenter')
      if (presenter) {
        presenter.presenter = user_id
        await presenter.save()
        res.json({ status: 'success', message: 'set presenter is ' + user_id })
      } else
        res.status(400).json({ status: 'error', message: 'meeting_id not available in session' })
    } else
      res.status(400).json({ status: 'error', message: 'user_id not available in server' })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.put('/clearpresenter', async function (req, res) {
  let meeting_id = req.body.meeting_id
  try {
    let presenter = await Sessionroom.findOne({ 'meeting_id': meeting_id }, 'presenter')
    if (presenter) {
      presenter.presenter = ''
      await presenter.save()
      res.json({ status: 'success', message: 'set presenter is false' })
    } else
      res.status(400).json({ status: 'error', message: 'meeting_id not available in session' })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.get('/getpresenter/:meetingid', async function (req, res) {
  let meeting_id = req.params.meetingid
  try {
    let presenter = await Sessionroom.findOne({ 'meeting_id': meeting_id }, 'presenter')
    if (presenter) {
      res.json({ status: 'success', message: 'get presenter from ' + meeting_id, data: presenter })
    } else
      res.status(400).json({ status: 'error', message: 'meeting_id not available in session' })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

// router.delete('/logout',async function(req,res){
//   try {
//     let session_destroy = await Sessionroom.findOne({'member.user_id': req.body.user_id})
//     if (session_destroy) {
//       if (session_destroy.user_id !== req.body.user_id) {
//         let array = session_destroy.member;
//         let index = array.map(function(e) { return e.user_id; }).indexOf(req.body.user_id);
//         if (index > -1) {
//           array.splice(index, 1)
//           session_destroy.member = array
//           session_destroy.save()
//           res.send({status:'success',message:'user in room logout'})
//         }
//       }else{
//         let last_session = await Rooms.findOne({'_id': session_destroy.room_id}) 
//         last_session.last_session= Date.now()
//         last_session.save()
//         session_destroy.delete()
//         res.send({status:'success',message:'room logout'})
//       }
//     }else{
//       res.send({status:'error',message:'No session'})
//     }
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// })


function settingroom (opt1, opt2, opt3, opt4, opt5) {
  let chkbox1, chkbox2, chkbox3, chkbox4, chkbox5
  if (opt1 == '')
    chkbox1 = false
  else
    chkbox1 = true
  if (opt2 == '')
    chkbox2 = false
  else
    chkbox2 = true
  if (opt3 == '')
    chkbox3 = false
  else
    chkbox3 = true
  if (opt4 == '')
    chkbox4 = false
  else
    chkbox4 = true
  if (opt5 == '')
    chkbox5 = false
  else
    chkbox5 = true
  return [chkbox1, chkbox2, chkbox3, chkbox4, chkbox5]
}

module.exports = router;