//Define socket.io handlers here
module.exports = function(server){
  var io = require('socket.io')(server);
  var MeetingManger = require('./meetingmanager');
  var manager = new MeetingManger();

  //on connection...
  io.on('connection', function(socket){

  });

  //creating our manager name space
  var managerSpace = io.of('/manager');

  //manager space on connection...
  managerSpace.on('connection', function(socket){
    console.log('Received new socket connection');

    //when user join, client will emit "user ready" and send data with username
    socket.on('user-ready', function(data) {
      //adding username property onto the socket
      username = data.username;
      
      //send participant info to user
      var users = manager.getUser();
      socket.emit('users', users);

      //adding the user to our meeting manager object
      manager.addUser(username, socket);


      //send userinfo to each participant
      var ids = Object.keys(manager.socketIds);
      for(var i = 0; i < ids.length; i++){
        socket.broadcast.to(ids[i]).emit('new-user', {username:username});
      }
    });

    //listen for when user disconnect so we can remove them from our users object
    //this still needs work!!!
    socket.on('disconnect', function(){
      console.log('user disconnected');
      try {
        var username = manager.getBySocketId(socket.id);
        socket.emit('user-disconnected', { username: username });
        delete manager.users[username];
        delete manager.socketIds[socket.id];
      } catch(e) {
        console.log(e.message);
      }
    });
    console.log('user in /manager', socket.id);
    //when client emits add
    socket.on('add', function(data){
      try {
        //it will add a meeting to the meeting manager
        manager.addMeeting(data);
        socket.emit('success');
      } catch(e) {
        socket.emit('err', e.message);
      }
    });

    //when client emits get, client send over nothing or meeting name/id
    socket.on('get', function(id){
      try {
        //it will get all meetings or specific meetings from the meeting manager
        socket.emit('meeting', manager.getMeeting(id) );
        socket.emit('success');
      } catch(e) {
        socket.emit('err', e.message);
      }
    });

    //when client emits get-user, client when send over nothing or username
    socket.on('get-user', function(username){
      try {
        //it will get all users or specific user's referenced socket
        socket.emit('user', manager.getUser(username) );
        socket.emit('success');
      } catch(e) {
        socket.emit('err', e.message);
      }
    });

    //when client emits signal, it will send over evt(event) and data
    socket.on('signal', function(evt, data){
      console.log('in signal');
      try {
        var user = data.to;
        console.log(evt);
        var to = manager.getUser(user);
        to.emit('signal', evt, data);
      } catch(e) {
        socket.emit('err', e.message);
      }
    });

  });

  return io;
};