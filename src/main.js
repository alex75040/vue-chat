import Vue from 'vue'
import MintUI from 'mint-ui'
import 'mint-ui/lib/style.css'
import App from './App'

////////////////////////////////////////////////////////////////////////////////
// INTEGRATION WITH CAF BACKEND

window.apiconn = new APIConnection()

window.apiconn.client_info.clienttype = "vue";

window.apiconn.state_changed_handler = function() {
    
    if (apiconn.conn_state == "IN_SESSION") {

        sessionStorage.setItem("login_name", apiconn.login_name);
        sessionStorage.setItem("login_passwd", apiconn.login_passwd);
        
    } else if (apiconn.conn_state == "LOGIN_SCREEN_ENABLED") {

        // auto re login after page refresh
        
        if (apiconn.login_name == "" && apiconn.credential_data == null) {
            
            var retVal = prompt("Enter your login name\n(test0, test1, test2, ...)");
            if (retVal == null) return;
            
            apiconn.login(retVal, "1");
            
            /* auto login here
            // apiconn.login(login_name, login_passwd);
            
            // auto login from saved credentials
            var login_name = sessionStorage.getItem("login_name");
            var login_passwd = sessionStorage.getItem("login_passwd");
        
            var cred = sessionStorage.getItem("credential_data");
            var cred_obj = null;
            if (cred !== "") cred_obj = JSON.parse(cred);

            // reset stored cred to prevent infinite loop in case of failure
            sessionStorage.setItem("login_name", "");
            sessionStorage.setItem("login_passwd", "");
            sessionStorage.setItem("credential_data", "");
            
            if (login_name != "" && login_name != null) {
                apiconn.login(login_name, login_passwd);

            } else if (cred_obj != null) {
                apiconn.loginx(cred_obj);
                
            } else {
            }*/
        }
        
    }
};

// for demo, keep the id of joined group
window.apiconn.response_received_handler = function(jo) {
     
    if (jo.ustr != null && jo.ustr != "" && jo.uerr != "ERR_CONNECTION_EXCEPTION") alert(jo.ustr);
    
    if (jo.obj == "person" && jo.act == "login" && jo.user_info && jo.server_info) {
        
        apiconn.send_obj({
            "obj": "group",
            "act": "join",
        }); 
    }
    
    if (jo.obj == "group" && jo.act == "join") {
        
        console.log("join group, return id: "+jo.header_id);
        
        window.group_header_id = jo.header_id;
        window.group_block_id = 0;
        
        // get a list of messages
        apiconn.send_obj({
            "obj": "message",
            "act": "group_get",
            "header_id": window.group_header_id,
        });
    }
    
    if (jo.obj == "message" && jo.act == "group_get") {
        /* 
        vue-chat format {
            type: 1,
            time: 'yyyy-MM-dd hh:mm:ss',
            name: '游客DDD',
            content: "HELLO!!"
        }
        
        CAF format {
          "content": "成功",
          "from_avatar": "f14686539620564930438001",
          "from_id": "o15372878095820300579",
          "from_name": "Noname",
          "mtype": "text",
          "send_time": 1560670851
        }*/
        
        window.globalvapp.$children[0].$children[1].records = [];
        
        jo.block.entries.forEach(function(e){
            
            if (e.mtype == "text") {
                globalvapp.$children[0].$children[1].records.push({
                    name: e.from_name,
                    avatar: (window.apiconn.server_info.download_path+e.from_avatar),
                    type: (e.from_id == apiconn.user_info._id ? 1:2),
                    time: timeConverter(e.send_time),
                    content: e.content
                });
            } else if (e.mtype == "image") {
                
            }
        });
        
        window.globalvapp.$children[0].$children[1].scrollToBottom();
    }
    
    // 发送消息返回，获取消息列表
    if (jo.obj == "message" && jo.act == "group_send") {
        apiconn.send_obj({
            "obj": "message",
            "act": "group_get",
            "header_id": window.group_header_id,
        });
    }
    
    // 群里有人发送消息推送，获取消息列表
    if (jo.obj == "push" && jo.act == "message_group") {
        apiconn.send_obj({
            "obj": "message",
            "act": "group_get",
            "header_id": window.group_header_id,
        });
    }
    
    if (jo.obj == "person" && jo.act == "logout") {
    }
    
    if (jo.obj == "test" && jo.act == "echo") {
        document.getElementById("msg").innerHTML = "[Single handler] Server returned: " + jo.echo;
    }
    
};

var h = apiconn.response_received_handlers_add(function(jo) {
    if (jo.obj == "test" && jo.act == "echo") {
        document.getElementById("msg").innerHTML += "<br>[Multple handlers] Server returned: " + jo.echo;
    }
});

// to remove this reponse handler list
// handler list works for state_changed_handlers_[add|remove] as well
//apiconn.response_received_handlers_remove(h);

window.apiconn.wsUri = "ws://47.92.169.34:51700/demo";
window.apiconn.connect();

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

////////////////////////////////////////////////////////////////////////////////

Vue.use(MintUI)

/* eslint-disable no-new */
window.globalvapp = new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
