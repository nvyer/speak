const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const socket = require("socket.io");
const io = socket(server);

app.use(cors());
const PORT = process?.env.PORT || 5000;

const users = {};
const socketToRoom = {};

app.get('/', (_, res) => {
	res.send('Running');
});

io.on('connection', socket => {

	socket.on("join room", roomID => {
		if (users[roomID]) {
			const length = users[roomID].length;
			if (length === 4) {
				socket.emit("room full");
				return;
			}
			users[roomID].push(socket.id);
		} else {
			users[roomID] = [socket.id];
		}

		socketToRoom[socket.id] = roomID;
		const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

		socket.emit("all users", usersInThisRoom);
	});

	socket.on("sending signal", payload => {
		io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
	});

	socket.on("returning signal", payload => {
		io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
	});

	socket.on('disconnect', () => {
		const roomID = socketToRoom[socket.id];
		let room = users[roomID];
		if (room) {
			room = room.filter(id => id !== socket.id);
			users[roomID] = room;
		}
		socket.broadcast.emit('user left', socket.id);
	});

});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


/****************************************** previous version ***************************************** */

// const io = require("socket.io")(server, {
// 	cors: {
// 		origin: "*",
// 		methods: [ "GET", "POST" ]
// 	}
// });

// io.on("connection", (socket) => {
// 	socket.emit("me", socket.id);

// 	socket.on("disconnect", () => {
// 		socket.broadcast.emit("callEnded")
// 	});

// 	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
// 		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
// 	});

// 	socket.on("answerCall", (data) => {
// 		io.to(data.to).emit("callAccepted", data.signal)
// 	});
// });