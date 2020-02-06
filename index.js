const {KeepLiveTCP} = require('bilibili-live-ws');
const EventEmitter = require('events');
const fs = require('fs');
const express = require('express');
const app = express();
const config = require('./config');
let currentLive = new Map();

const reg = /(.*)【(.*)】|(.*)【(.*)/;

app.get('/api/live', function (req, res) {
    const roomId = parseInt(req.query.roomId);
    const status = parseInt(req.query.status);
    console.log(roomId + ': ' + status);
    watch({roomId, status});
    res.send({'msg': 1});
});
app.listen(config.ExpressPort, function () {
    console.log(`listening on port ${config.ExpressPort}!`);
});
const watch = ({roomId, status}) => {
    let live = new LiveEvent(roomId);
    currentLive[roomId] = status;
    if (status) {
        live.emit('start');
    }
};

class LiveEvent extends EventEmitter {
    constructor(roomId) {
        super();
        this.roomId = roomId;
        this.path = `${config.DownloadDir}/${this.roomId}_${Date.now()}.txt`;
        this.live = new KeepLiveTCP(roomId);
        this.watch();
        this.on('start', () => {
            this.monitor(this.roomId);
        });
        this.on('close', () => {
            this.live.close();
        })
    }

    monitor = () => {
        this.live.on('open', () => console.log(this.roomId + 'Connection is established'));
        this.live.on('DANMU_MSG', (data) => {
            let text = data['info'][1];
            console.log(text);
            const f = fs.createWriteStream(this.path, {flags: 'a+'});
            let s = this.danmakuFilter(text);
            if (s) {
                f.write(s + '\n');
            }
        })
    };
    watch = () => {
        setInterval(() => {
            if (currentLive[this.roomId] === 0) {
                this.emit('close')
            } else {
                console.log(`KeepAlive ${this.roomId}`)
            }
        }, 3000)
    };
    danmakuFilter = (original,) => {
        let matchres = original.match(reg);
        if (matchres && matchres.length > 0) matchres = matchres.filter(a => a && a.trim());
        if (matchres && matchres.length > 1) matchres = matchres.splice(1);
        // if (matchres) matchres = matchres.join(joinLetter);
        return matchres || null;
    }
}