const {KeepLiveTCP} = require('bilibili-live-ws');
const EventEmitter = require('events');
const fs = require('fs');
const express = require('express');
const app = express();
const config = require('./config');
let currentLive = new Map();

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
        this.live = new KeepLiveTCP(roomId);
        this.startTime = Date.now();

        this.count = 0;
        this.prevTime = "";
        this.prevText = "";

        let path = `${config.DownloadDir}/${this.roomId}_${this.startTime}.srt`;
        this.file = fs.createWriteStream(path, {flags: 'a+'});

        this.watch();
        this.on('start', () => {
            this.monitor(this.roomId);
        });
        this.on('close', () => {
            this.writeSubtitle(null);
            this.live.close();
        })
    }

    writeSubtitle(text) {
        let lastTime = Date.now() - this.startTime;
        let h  = Math.floor(lastTime/1000/60/60);
        let m  = Math.floor(lastTime/1000/60%60);
        let s  = Math.floor(lastTime/1000%60);
        let ms = Math.floor(lastTime%1000);

        let t1 = (time) => ((time<10)?'0':'')+time;
        let t2 = (time) => ((time<10)?'00':(time<100)?'0':'')+time;

        let now = `${t1(h)}:${t1(m)}:${t1(s)}.${t2(ms)}`;

        if (this.count != 0) {
            this.file.write(`${this.count}\n${this.prevTime} --> ${now}\n${this.prevText}\n`);
        }
        this.count++;

        if (!text) {
            this.file.close();
            return;
        }
        this.prevTime = now;
        this.prevText = text;
    }

    monitor() {
        this.live.on('open', () => console.log(this.roomId + 'Connection is established'));
        this.live.on('DANMU_MSG', (data) => {
            let danmakuText = data['info'][1];
            let subtitle = this.danmakuFilter(danmakuText);
            if (subtitle) this.writeSubtitle(subtitle);
        });
    };
    watch() {
        setInterval(() => {
            if (currentLive[this.roomId] === 0) {
                this.emit('close')
            } else {
                console.log(`KeepAlive ${this.roomId}`)
            }
        }, 3000);
    };
    danmakuFilter(raw) {
        let leftPos = raw.indexOf("【");
        let rightPos = raw.indexOf("】");

        if (leftPos == -1 && rightPos == -1) return null;
        if (leftPos != 0) raw = raw.replace("【", "：");

        return raw.replace("【", "").replace("】", "");
    }
}