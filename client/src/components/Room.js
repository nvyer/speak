import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        });
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ ref } />
    );
};


const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const Room = () => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const params = useParams();
    const userVideo = useRef();
    const peersRef = useRef([]);

    useEffect(() => {
        socketRef.current = io.connect('http://localhost:5000/', {
            transports: ["websocket", "polling"],
        });

        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", params.roomID);

            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);

                    peersRef.current.push({ peerID: userID, peer });
                    peers.push({ peerID: userID, peer });
                });
                setPeers(peers);
            });

            socketRef.current.on("user joined", payload => {
                console.log('user joined');
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({ peerID: payload.callerID, peer });

                setPeers(users => [...users, { peer, peerID: payload.callerID }]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("user left", (id) => {
                const peerObj = peersRef.current.find(p => p.peerID === id);

                if (peerObj) {
                    peerObj.peer.destroying = true;
                    peerObj.peer.destroy();
                }

                peersRef.current = peersRef.current.filter(p => p.peerID !== id);
                setPeers(users => users.filter(p => p.peerID !== id));
            });
        });
    }, []);

    function createPeer (userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal });
        });

        return peer;
    }

    function addPeer (incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <Container>
            <StyledVideo muted ref={ userVideo } autoPlay playsInline />
            { peers.map(peer => {
                return (
                    <Video key={ peer.peerID } peer={ peer.peer } />
                );
            }) }
        </Container>
    );
};

export default Room;