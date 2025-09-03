const { Socket } = require("dgram");
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use("/public", express.static("public"))

let rounds = [],
matchesNumber = 0;(arrID = []), (arr = []), (playingArray = []), (room = []), (players = [])
const playersStatus = { clientOnline: 0, matches: 0 }

io.on("connection", (socket) => {
    socket.on("find", (e) => {
        if (e) {
            arr.push(e.name)
            arrID.push(e.id)

            if (arr.length >= 2) {
                let p1obj = {
                    player1ID: arrID[0],
                    playerNumber: 1,
                    p1name: arr[0],
                    p1value: "X",
                    p1move: "",
                    p1round: "",
                }
                let p2obj = {
                    player2ID: arrID[1],
                    playerNumber: 2,
                    p2name: arr[1],
                    p2value: "O",
                    p2move: "",
                    p2round: "",
                }
                let obj = {
                    roomNumber: playingArray.length,
                    p1: p1obj,
                    p2: p2obj,
                    sum: 1,
                    status: true,
                    roundChoose: [],
                }
                playingArray.push(obj)
                arr.splice(0, 2)
                arrID.splice(0, 2)
                matchesNumber++

                io.emit("matchesNumber", {
                    matchesNumber: matchesNumber
                })
                io.to(p1obj.player1ID).emit("find", {
                    id: p2obj.player2ID,
                    name: p2obj.p2name,
                    value: p2obj.p2value,
                    myValue: 2,
                    icon: "X",
                    roomNumber: obj.roomNumber,
                    opponentName: p2obj.p2name,
                })
                io.to(p2obj.player2ID).emit("find", {
                    id: p1obj.player1ID,
                    name: p1obj.p1name,
                    value: p1obj.p1value,
                    myValue: 1,
                    icon: "O",
                    roomNumber: obj.roomNumber,
                    opponentName: p1obj.p1name,
                })
            }
        }
    })

    socket.on("createRoom", (e) => {
        let roomNumber = Math.floor(Math.random() * 900000) + 100000
        if (e.name != "") {
            while (true) {
                if (!room.some((r) => roomNumber == r.roomCode)) {
                    break
                } else {
                    roomNumber = Math.floor(Math.random() * 900000) + 100000
                }
            }
            const createRoom = {
                p1name: e.name,
                p1id: e.id,
                p2name: "",
                p2id: "",
                roomCode: roomNumber,
            }
            room.push(createRoom)
            io.to(e.id).emit("createRoom", {
                roomCode: createRoom.roomCode
            })
        }
    })
    socket.on("searchRoom", (e) => {
        const myRoom = room.find((r) => r.roomCode == e.code)
        if (myRoom != undefined) {
            myRoom.p2name = e.name
            mtRoom.p2id = e.id
            createMatch(myRoom)
        }
        function createMatch(e) {
            let p1obj = {
                player1ID: e.p1id,
                playerNumber: 1,
                p1name: e.p1name,
                p1value: "X",
                p1move: "",
                roomNumber: playingArray.length,
            }
            let p2obj = {
                player2ID: e.p2id,
                playerNumber: 2,
                p2name: e.p2name,
                p2value: "O",
                p2move: "",
                roomNumber: playingArray.length,
            }
            let obj = {
                roomNumber: playingArray.length,
                p1: p1obj,
                p2: p2obj,
                sum: 1,
                status: true,
                roundChoose: [],
            }
            playingArray.push(obj)
            arr.splice[0, 2]
            arrID.splice[0, 2]
            matchesNumber++

            io.emit("matchesNumber", {
                matchesNumber: matchesNumber
            })
            io.to(p1obj.player1ID).emit("find", {
                id: p2obj.player2ID,
                name: p2obj.p2name,
                value: p2obj.p2value,
                myValue: 2,
                icon: "X",
                roomNumber: obj.roomNumber,
                opponentName: p2obj.p2name,
            })
            io.to(p2obj.player2ID).emit("find", {
                id: p1obj.player1ID,
                name: p1obj.p1name,
                value: p1.obj.p2obj,
                myValue: 1,
                icon: "X",
                roomNumber: obj.roomNumber,
                opponentName: p2obj.p2name,
            })
            io.to(p2obj.player2ID).emit("find", {
                id: p1obj.player1ID,
                name: p1obj.p1name,
                value: p1obj.p1value,
                icon: "O",
                roomNumber: obj.roomNumber,
                opponentName: p1obj.p1name,
            })
        }
    })
    socket.on("sendMessage", (e) => {
        const myRoom = playingArray[e.roomNumber]

        io.to(e.myValue == 1 ? myRoom.p1.player1ID : myRoom.p2.player2ID).emit("sendMessage", e.text)
    })
    socket.on("round", (e) => {
        const myRoom = playingArray[e.roomNumber]
        myRoom.roundChoose.push(e.round)
        if (myRoom.roundChoose.length == 2) {
            let roundNumber
            if (myRoom.roundChoose[0] == myRoom.roundChoose[1]) {
                roundNumber = myRoom.roundChoose[0]
            } else {
                roundNumber = 0
            }
            io.to(myRoom.p2.player2ID).to(myRoom.p1.player1ID).emit("round", { round: roundNumber })
        }
    })
    socket.on("playing", (e) => {
        const myRoom = playingArray[e.roomNumber]

        if (e.value === "O") {
            myRoom.p1.p1move = e.id
            e.sum++
        } else if (e.value === "X") {
            myRoom.p2.p2move = e.id
            e.sum++
        }
        io.to(myRoom.p1.player1ID).to(myRoom.p2.player2ID).emit("playing", myRoom)
    })
    socket.on("clientConnect", (e) => {
        socket.join(e)
        players.push(e)
        playersStatus.clientOnline = players.length
        io.emit("clientsNumber", playersStatus)

        io.to(e).emit("matchesNumber", { matchesNumber: matchesNumber })
    })
    socket.on("clientDisconnect", (e) => {
        players.splice(players.indexOf(e.ID), 1)
        if (e.roomNumber !== "") {
            const myRoom = playingArray[e.roomNumber]
            if (myRoom.status) {
                io.to(myRoom.p2.player2ID == e.ID ? myRoom.p1.player1ID : myRoom.p2.player2ID).emit("stopGame")
            }
        } else if (arrID.includes(e.ID)) {
            arr.splice(arr.indexOf(e.name), 1)
            arrID.splice(arr.indexOf(e.ID), 1)
        }
        playersStatus.clientOnline = players.length
        io.emit("clientsNumber", playersStatus)
    })
    socket.on("gameOverRoom", (e) => {
        if(e.roomNumber !== "") {
            const myRoom = playingArray[e.roomNumber]
            if (myRoom.status) {
                myRoom.status = false
                matchesNumber--

                io.emit("matchesNumber", { matchesNumber: matchesNumber })
            }
        }
    })
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"))
})
server.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`)
})