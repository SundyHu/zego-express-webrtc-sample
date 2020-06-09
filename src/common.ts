/* eslint-disable @typescript-eslint/no-use-before-define */
import VConsole from 'vconsole';
import './assets/bootstrap.min';
import './assets/bootstrap.min.css';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { StreamInfo, webPublishOption, ERRO } from 'zego-express-engine-webrtc/sdk/common/zego.entity';
import { getCgi } from './content';

new VConsole();
const userID: string = 'sample' + new Date().getTime();
const userName: string = 'sampleUser' + new Date().getTime();
const tokenUrl = 'https://wsliveroom-demo.zego.im:8282/token';
const publishStreamId = 'webrtc' + new Date().getTime();
let zg: ZegoExpressEngine;
let appID = 1739272706;
let server = 'wss://webliveroom-test.zego.im/ws'; //'wss://wsliveroom' + appID + '-api.zego.im:8282/ws'
let cgiToken = '';
//const appSign = '';
let previewVideo: HTMLVideoElement;
let useLocalStreamList: StreamInfo[] = [];
let isPreviewed = false;
let supportScreenSharing = false;

let localStream: MediaStream;

// 测试用代码，开发者请忽略
// Test code, developers please ignore

({ appID, server, cgiToken } = getCgi(appID, server, cgiToken));
if (cgiToken && tokenUrl == 'https://wsliveroom-demo.zego.im:8282/token') {
    $.get(cgiToken, rsp => {
        cgiToken = rsp.data;
        console.log(cgiToken);
    });
}
// 测试用代码 end
// Test code end

// eslint-disable-next-line prefer-const
zg = new ZegoExpressEngine(appID, server);

async function checkAnRun(checkScreen?: boolean): Promise<boolean> {
    console.log('sdk version is', zg.getVersion());
    const result = await zg.checkSystemRequirements();

    console.warn('checkSystemRequirements ', result);
    !result.videoCodec.H264 && $('#videoCodeType option:eq(1)').attr('disabled', 'disabled');
    !result.videoCodec.VP8 && $('#videoCodeType option:eq(2)').attr('disabled', 'disabled');

    if (!result.webRTC) {
        alert('browser is not support webrtc!!');
        return false;
    } else if (!result.videoCodec.H264 && !result.videoCodec.VP8) {
        alert('browser is not support H264 and VP8');
        return false;
    } else if (result.videoCodec.H264) {
        supportScreenSharing = result.screenSharing;
        if (checkScreen && !supportScreenSharing) alert('browser is not support screenSharing');
        previewVideo = $('#previewVideo')[0] as HTMLVideoElement;
        start();
    } else {
        alert('不支持H264，请前往混流转码测试');
    }

    return true;
}

async function start(): Promise<void> {
    initSDK();

    zg.setLogConfig({
        logLevel: 'debug',
        remoteLogLevel: 'info',
        logURL: '',
    });
    // zg.config({ userUpdate: true });
    zg.setDebugVerbose(false);

    $('#createRoom').click(async () => {
        let loginSuc = false;
        try {
            loginSuc = await enterRoom();
            loginSuc && (await push());
        } catch (error) {
            console.error(error);
        }
    });

    $('#openRoom').click(async () => {
        await enterRoom();
    });

    $('#leaveRoom').click(function() {
        logout();
    });
}

async function enumDevices(): Promise<any> {
    const audioInputList: string[] = [],
        videoInputList: string[] = [];
    const deviceInfo = await zg.enumDevices();

    deviceInfo &&
        deviceInfo.microphones.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = 'microphone' + index;
            }
            audioInputList.push(' <option value="' + item.deviceID + '">' + item.deviceName + '</option>');
            console.log('microphone: ' + item.deviceName);
            return item;
        });

    deviceInfo &&
        deviceInfo.cameras.map((item, index) => {
            if (!item.deviceName) {
                item.deviceName = 'camera' + index;
            }
            videoInputList.push(' <option value="' + item.deviceID + '">' + item.deviceName + '</option>');
            console.log('camera: ' + item.deviceName);
            return item;
        });

    audioInputList.push('<option value="0">禁止</option>');
    videoInputList.push('<option value="0">禁止</option>');

    $('#audioList').html(audioInputList.join(''));
    $('#videoList').html(videoInputList.join(''));
}

function initSDK(): void {
    enumDevices();
    zg.on('roomStateUpdate', (roomID, state, errorCode, extendedData) => {
        console.log('roomStateUpdate: ', roomID, state, errorCode, extendedData);
    });
    zg.on('roomUserUpdate', (roomID, updateType, userList) => {
        console.warn(
            `roomUserUpdate: room ${roomID}, user ${updateType === 'ADD' ? 'added' : 'left'} `,
            JSON.stringify(userList),
        );
    });
    zg.on('publisherStateUpdate', result => {
        console.log('publisherStateUpdate: ', result.streamID);
        if (result.state == 'PUBLISHING') {
            console.info(' publish  success');
        } else if (result.state == 'PUBLISH_REQUESTING') {
            console.info(' publish  retry');
        } else {
            console.error('publish error ' + result.errorCode);
            // const _msg = stateInfo.error.msg;
            // if (stateInfo.error.msg.indexOf ('server session closed, reason: ') > -1) {
            //         const code = stateInfo.error.msg.replace ('server session closed, reason: ', '');
            //         if (code === '21') {
            //                 _msg = '音频编解码不支持(opus)';
            //         } else if (code === '22') {
            //                 _msg = '视频编解码不支持(H264)'
            //         } else if (code === '20') {
            //                 _msg = 'sdp 解释错误';
            //         }
            // }
            // alert('推流失败,reason = ' + _msg);
        }
    });
    zg.on('playerStateUpdate', result => {
        console.log('playerStateUpdate', result.streamID);
        if (result.state == 'PLAYING') {
            console.info(' play  success');
        } else if (result.state == 'PLAY_REQUESTING') {
            console.info(' play  retry');
        } else {
            console.error('publish error ' + result.errorCode);
            // const _msg = stateInfo.error.msg;
            // if (stateInfo.error.msg.indexOf ('server session closed, reason: ') > -1) {
            //         const code = stateInfo.error.msg.replace ('server session closed, reason: ', '');
            //         if (code === '21') {
            //                 _msg = '音频编解码不支持(opus)';
            //         } else if (code === '22') {
            //                 _msg = '视频编解码不支持(H264)'
            //         } else if (code === '20') {
            //                 _msg = 'sdp 解释错误';
            //         }
            // }
            // alert('拉流失败,reason = ' + _msg);
        }
    });
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
        console.log('roomStreamUpdate roomID ', roomID, streamList);
        if (updateType == 'ADD') {
            for (let i = 0; i < streamList.length; i++) {
                console.info(streamList[i].streamID + ' was added');
                useLocalStreamList.push(streamList[i]);
                let remoteStream: MediaStream;

                try {
                    remoteStream = await zg.startPlayingStream(streamList[i].streamID);
                } catch (error) {
                    console.error(error);
                    break;
                }

                $('.remoteVideo').append($('<video  autoplay muted playsinline controls></video>'));
                const video = $('.remoteVideo video:last')[0] as HTMLVideoElement;
                console.warn('video', video, remoteStream);
                video.srcObject = remoteStream!;
                video.muted = false;
            }
        } else if (updateType == 'DELETE') {
            for (let k = 0; k < useLocalStreamList.length; k++) {
                for (let j = 0; j < streamList.length; j++) {
                    if (useLocalStreamList[k].streamID === streamList[j].streamID) {
                        try {
                            zg.stopPlayingStream(useLocalStreamList[k].streamID);
                        } catch (error) {
                            console.error(error);
                        }

                        console.info(useLocalStreamList[k].streamID + 'was devared');

                        useLocalStreamList.splice(k, 1);

                        $('.remoteVideo video:eq(' + k + ')').remove();
                        $('#memberList option:eq(' + k + ')').remove();

                        break;
                    }
                }
            }
        }
    });

    zg.on('playQualityUpdate', async (streamID, streamQuality) => {
        console.log(
            `play#${streamID} videoFPS: ${streamQuality.video.videoFPS} videoBitrate: ${streamQuality.video.videoBitrate} audioBitrate: ${streamQuality.audio.audioBitrate}`,
        );
    });

    zg.on('publishQualityUpdate', async (streamID, streamQuality) => {
        console.log(
            `publish#${streamID} videoFPS: ${streamQuality.video.videoFPS} videoBitrate: ${streamQuality.video.videoBitrate} audioBitrate: ${streamQuality.audio.audioBitrate}`,
        );
    });

    zg.on('remoteCameraStatusUpdate', (streamID, status) => {
        console.warn(`${streamID} camera status ${status == 'OPEN' ? 'open' : 'close'}`);
    });

    zg.on('remoteMicStatusUpdate', (streamID, status) => {
        console.warn(`${streamID} micro status ${status == 'OPEN' ? 'open' : 'close'}`);
    });
}

async function login(roomId: string): Promise<boolean> {
    // 获取token需要客户自己实现，token是对登录房间的唯一验证
    // Obtaining a token needs to be implemented by the customer. The token is the only verification for the login room.
    let token = '';
    //测试用，开发者请忽略
    //Test code, developers please ignore
    if (cgiToken) {
        token = await $.get(tokenUrl, {
            app_id: appID,
            id_name: userID,
            cgi_token: cgiToken,
        });
        //测试用结束
        //Test code end
    } else {
        token = await $.get('https://wsliveroom-alpha.zego.im:8282/token', {
            app_id: appID,
            id_name: userID,
        });
    }
    return await zg.loginRoom(roomId, token, { userID, userName }, { userUpdate: true });
}

async function enterRoom(): Promise<boolean> {
    const roomId: string = $('#roomId').val() as string;
    if (!roomId) {
        alert('roomId is empty');
        return false;
    }
    await login(roomId);

    return true;
}

async function logout(): Promise<void> {
    console.info('leave room  and close stream');

    // 停止推流
    // stop publishing
    if (isPreviewed) {
        zg.stopPublishingStream(publishStreamId);
        zg.destroyStream(localStream);
        isPreviewed = false;
    }

    // 停止拉流
    // stop playing
    for (let i = 0; i < useLocalStreamList.length; i++) {
        zg.stopPlayingStream(useLocalStreamList[i].streamID);
    }

    // 清空页面
    // Clear page
    useLocalStreamList = [];
    $('.remoteVideo').html('');

    //退出登录
    //logout
    const roomId: string = $('#roomId').val() as string;
    zg.logoutRoom(roomId);
}

async function push(publishOption?: webPublishOption): Promise<void> {
    console.warn('createStream', $('#audioList').val(), $('#videoList').val());
    localStream = await zg.createStream({
        camera: {
            audioInput: $('#audioList').val() as string,
            videoInput: $('#videoList').val() as string,
            video: $('#videoList').val() === '0' ? false : true,
            audio: $('#audioList').val() === '0' ? false : true,
        },
    });
    previewVideo.srcObject = localStream;
    isPreviewed = true;
    const result = zg.startPublishingStream(publishStreamId, localStream, publishOption);
    console.log('publish stream' + publishStreamId, result);
}

$('#toggleCamera').click(function() {
    zg.mutePublishStreamVideo(previewVideo.srcObject as MediaStream, $(this).hasClass('disabled'));
    $(this).toggleClass('disabled');
});

$('#toggleSpeaker').click(function() {
    zg.mutePublishStreamAudio(previewVideo.srcObject as MediaStream, $(this).hasClass('disabled'));
    $(this).toggleClass('disabled');
});

export { zg, publishStreamId, checkAnRun, supportScreenSharing, userID, useLocalStreamList, logout, enterRoom, push };

$(window).on('unload', function() {
    logout();
});
