(function (global) {

  "use strict";

  function init(ByteBuffer) {

    var nzappapi = {};

    var builder = undefined;
    var cb = undefined;
    var socket = undefined;
    var connected = false;
    var initialized = false;

    var BaseMsgId = 0x1100;
    var AppLaunchMsgId = BaseMsgId+1;
    var AppLaunchRespMsgId = BaseMsgId+2;
    var AppLaunchFailedMsgId = BaseMsgId+3;
    var AppUpdateMsgId = BaseMsgId+4;
    var AppActivateMsgId = BaseMsgId+5;
    var AppVisibilityChangedMsgId = BaseMsgId+6;
    var AppCloseMsgId = BaseMsgId+7;
    var AppKeyMsgId = BaseMsgId+8;
    var AppVisibleMsgId = BaseMsgId+9;
    var AppShutdownMsgId = BaseMsgId+10;
    var AppRegisterOidMsgId = BaseMsgId+11;
    var AppReleaseMsgId = BaseMsgId+12;
    var AppSendRawMessageMsgId = BaseMsgId+13;
    var AppRcvRawMessageMsgId = BaseMsgId+14;

    nzappapi.ByteBuffer = ByteBuffer;

    // Node Buffers have BE write, Array Buffers do not.
    if (ByteBuffer.writeUInt32BE)
    {
      ByteBuffer.writeUInt32BE = ByteBuffer.writeUInt32;
    }

    // Big endian read
    function readUInt32(abuff) {
      var buffer = new Uint8Array(abuff);
      var value = 0;
      for (var i = 0; i < 4; i ++) {
	       value = (value << 8) + buffer[i];
      }
      return value;
    }

    // Big endian write
    function writeUInt32(value, abuff, offset) {
      var buffer = new Uint8Array(abuff);
      for (var i = offset + 3; i >= offset; i--) {
	       buffer[i] = value & 0xFF;
	       value = value >> 8;
      }
    }

    function sendRpcMsg(obj) {
      if (connected) {
        var encodedBuffer = obj.buffer;
        var msgId = obj.msgId;
        var abuff = new ArrayBuffer(8);
        writeUInt32(encodedBuffer.byteLength + 4, abuff, 0);
        writeUInt32(msgId, abuff, 4);

        var buffer = new ByteBuffer(8 + encodedBuffer.byteLength);
        buffer.append(abuff);
        buffer.append(encodedBuffer);

        socket.send(buffer.buffer);
        return true;
      } else {
        if (obj.retry > 0) {
           obj.retry--;
           setTimeout(sendRpcMsg, 50, obj);
        } else {
          console.log("Cannot send App Message - no connection")
        }
      }
    }

    function connect(url) {
      socket = new WebSocket(url);
      socket.binaryType = "arraybuffer"; // We are talking binary

      socket.onopen = function() {
        console.log("Connected to " + url);
        connected = true;
      };

      socket.onclose = function() {
        console.log("Disconnected from " + url);
        socket = undefined;
        connected = false;
        setTimeout(function() { connect(url) }, 1000);
      };

      socket.onerror = function() {
        console.log("Error on connection to " + url);
        connected = false;
        setTimeout(function() { connect(url) }, 1000);
      }

      socket.onmessage = function(evt) {
        try {
          console.log("onmessage");
          processRpc(socket, evt.data);
        } catch (err) {
          console.log("error");
        }
      };
    }

    function processRpc(socket, packet) {
      var len = readUInt32(packet.slice(0,4));
      var msgId = readUInt32(packet.slice(4,8));

      switch (msgId) {

	  case AppLaunchRespMsgId: {
	  var d = builder.AppLaunchResp.decode(packet.slice(8));
	  // console.log("App Launch Resp: " + JSON.stringify(d));
	  if (cb.AppLaunchResp)
          {
	    cb.AppLaunchResp(d.AppId);
          }
	}
        break;
        case AppLaunchFailedMsgId: {
          var d = builder.AppLaunchFailed.decode(packet.slice(8));
          // console.log("App Launch Failed: " + JSON.stringify(d));
          if (cb.AppLaunchFailed)
          {
             cb.AppLaunchFailed(d.Url);
          }
        }
        break;
        case AppVisibilityChangedMsgId: {
          var d = builder.AppClose.decode(packet.slice(8));
          // console.log("App Visibility Changed: " + JSON.stringify(d));
          if (cb.AppVisibilityChanged)
          {
             cb.AppVisibilityChanged(d.AppId);
          }
        }
        break;
        case AppCloseMsgId: {
          var d = builder.AppClose.decode(packet.slice(8));
          // console.log("App Closed: " + JSON.stringify(d));
          if (cb.AppClose)
          {
             cb.AppClose(d.AppId);
          }
        }
        break;
        case AppRcvRawMessageMsgId: {
          var d = builder.AppLaunchResp.decode(packet.slice(8));
          // console.log("App Rcv Raw: " + JSON.stringify(d));
          if (cb.AppRcvRawMessage)
          {
             cb.AppRcvRawMessage(d.Source, d.AppOid, d.Parm, d.Data);
          }
        }
        break;
        default:
          console.log("Unknown message recevied: " + msgId);
      }
    }

    //-----------------------------------------------------

    nzappapi.Initialize = function(protofile, callbacks) {
      cb = callbacks;
      if (navigator.appApiPort) {
        builder = dcodeIO.ProtoBuf.loadProtoFile(protofile).build("nzappapi");
        if (builder) {
          if (navigator.appApiIpAddress) {
            connect("ws://" +  navigator.appApiIpAddress + ":" + navigator.appApiPort);
          } else {
            connect("ws://localhost:" + navigator.appApiPort);
          }
          initialized = true;
        } else {
          console.log("Failed to initialized Protocol buffers for nzappapi");
        }
      } else {
        console.log("Cannot connect: navigator.appApiPort not defined")
      }
    }

    nzappapi.AppLaunch = function(Url, X, Y, Width, Height, VideoWidth, VideoHeight, ZOrder, Opaque) {
      if (initialized) {
        var b = new builder.AppLaunch(Url, X, Y, Width, Height, VideoWidth, VideoHeight, ZOrder, 0, 0, Opaque);

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppLaunchMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppUpdate = function (AppId, X, Y, Width, Height, VideoWidth, VideoHeight, ZOrder) {
      if (initialized) {
        var b = new builder.AppLaunch(AppId, X, Y, Width, Height, VideoWidth, VideoHeight, ZOrder);

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppUpdateMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppActivate = function(AppId) {
      if (initialized) {
        var b = new builder.AppActivate(AppId);

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppActivateMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppClose = function(AppId) {
      if (initialized) {
        var b = new builder.AppClose(AppId);

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppCloseMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppVisible = function() {
      if (initialized) {
        var b = new builder.AppVisible();

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppVisibleMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppShutdown = function() {
      if (initialized) {
        var b = new builder.AppShutdown();

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppShutdownMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppRegisterOid = function(AppOid) {
      if (initialized) {
        var b = new builder.AppRegisterOid(AppOid);

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppRegisterOidMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppReleaseOid = function(AppOid) {
      if (initialized) {
        var b = new builder.AppReleaseOid(AppOid);

	return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppReleaseOidMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    nzappapi.AppSendRawMessage = function(Destination, AppOid, Parm, Data) {
      if (initialized) {
        var b = new builder.AppSendRawMessage(AppOid);

        return sendRpcMsg({buffer: b.toArrayBuffer(), msgId: AppSendRawMessageMsgId, retry: 5});
      } else {
        throw "API not intialized";
      }
    }

    return nzappapi;
  }

  if (typeof require === 'function' &&
      typeof module === 'object' && module &&
      typeof exports === 'object' && exports)
    module['exports'] = init(require("bytebuffer"));
  else
    (global["nz"] = global["nz"] || {})["nzappapi"] =
      init(global["dcodeIO"]["ByteBuffer"]);

 }(this));
