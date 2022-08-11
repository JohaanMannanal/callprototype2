let APP_ID = 'de25ddfa18824309a3b511a91397e94f'

let peerConnection;
let localStream;
let remoteStream;

let uid = String(Math.floor(Math.random)*10000)
let token = null;
let client

let servers = {
  iceServers:[
    {
      urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
    }
  ]
}

let init = async () => {
  client = await AgoraRTM.createInstance(APP_ID)
  await client.login({uid, token})

  const channel = client.createChannel('main')
  channel.join()

  channel.on('MemberJoined', handlePeerJoined)

  localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
  document.querySelector('#user-1').srcObject = localStream
}

let handlePeerJoined = async (MemberId) => {
  console.log('A new peer has joined this room:', MemberId)
}

let createPeerConnection = async (sdpType) => {
  peerConnection = new RTCPeerConnection(servers)

  remoteStream = new MediaStream()
  document.querySelector('#user-2').srcObject = remoteStream

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  })

  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  peerConnection.onicecandidate = async (event) => {
    if(event.candidate) {
      document.querySelector(sdpType).value = JSON.stringify(peerConnection.LocalDescription)
    }
  }
}

let createOffer = async () => {
  createPeerConnection('offer-sdp')

  let offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)

  document.getElementById('offer-sdp').value = JSON.stringify(offer)
}

let createAnswer = async () => {
  createPeerConnection('answer-sdp')

  let offer = document.querySelector('#offer-sdp').value
  if(!offer) return alert('Retrieve offer from peer first...')

  offer = JSON.parse(offer)
  await peerConnection.setRemoteDescription(offer)

  let answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  document.querySelector('#answer-sdp').value = JSON.stringify(answer)
}

let addAnswer = async () => {
  let answer = document.querySelector('#answer-sdp').value
  if (!answer) return alert('Retrieve answer from peer first...')

  answer = JSON.parse(answer)

  if(!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer)
  }
}

init()

document.querySelector('#create-offer').addEventListener('click', createOffer)
document.querySelector('#create-answer').addEventListener('click', createAnswer)
document.querySelector('#add-answer').addEventListener('click', addAnswer)