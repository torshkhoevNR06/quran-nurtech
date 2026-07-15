# Mushaf Advanced Polish QA

Total: 9
Failed: 0

- PASS desktop zoom button applies transform: scale=2.00
- PASS desktop pan/zoom state persisted: {"page":8,"scale":2.000000000000001,"panX":-387.5,"panY":-446.82031110830434}
- PASS desktop reload restores zoom state: scale=2.00 state={"page":8,"scale":2.000000000000001,"panX":-387.5,"panY":-446.82031110830434}
- PASS desktop immersive hides app chrome: {"cls":true,"topDisplay":"none","sideDisplay":"none"}
- PASS mobile mushaf fits viewport without horizontal overflow: {"overflow":0,"sheet":{"x":6,"y":70,"width":378,"height":536.921875,"top":70,"right":384,"bottom":606.921875,"left":6},"page":{"x":17,"y":89,"width":356,"height":492.921875,"top":89,"right":373,"bottom":581.921875,"left":17},"viewport":{"w":390,"h":844}}
- PASS mobile mushaf has separate light/dark palette: light={"bg":"rgb(251, 250, 246)","color":"rgb(106, 111, 102)"} dark={"bg":"rgb(23, 27, 32)","color":"rgb(183, 192, 201)"}
- PASS mobile zoom fab applies zoom: scale=1.10
- PASS mobile pinch gesture changes/persists zoom: before=1.10 after=2.61 state={"page":2,"scale":2.6125000000000003,"panX":-287.02499895095826,"panY":-401.62196846008305}
- PASS mobile immersive hides app chrome and stays inside viewport: {"cls":true,"top":"none","tab":"none","toolbar":"none","overflow":0}