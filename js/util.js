/* vim: set et sw=4 ts=4 sts=4 fdm=syntax ff=unix fenc=utf8: */
	var sendReq = function(o){
		var auth = "Basic "+btoa(config.username+':'+config.password),
			fn = o.fn || creatList,
			req = new XMLHttpRequest(),
			msg = o.msg || null,
            sid = o.sid?'since_id='+o.sid:'';
//            console.log(o);
//            console.log('asd'+o.url,o.sid);
		if (o.msg) {
			req.open('POST', o.url+'&'+msg+'&'+sid , true);
			req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}else {
			req.open('POST', o.url+'&'+sid , true);
            console.log(req, o.url+'&'+sid);
		}
		req.setRequestHeader('Authorization', auth);
		req.send(msg);

		req.onreadystatechange = function(){
		if (req.readyState == 4 ){
			if(req.status == 200 ) {
					var obj = eval('(' + req.responseText + ')');
                    if (config.defaultOrder == 0 && obj[0]) config.sid = obj[0].id;
					fn(obj, o.type);
				}else {
					fn({'error':'饭否君不给力了:..('})
				}
			}
		}
		return req;
	};

    var returnMsgList = function(obj, className){
        var str = '';
        for(var i=0, leng= obj.length; i<leng; i++) {
            var o = obj[i];
        //       console.log(o);
            var cName = className?' class="'+className+'"':'';
            var d = new Date(o.created_at);
            var time = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
            var reply = (o.in_reply_to_screen_name !== '')?'回复'+o.in_reply_to_screen_name+'于':'';
            str += '<li '+cName+'data-id="'+o.id+'" data-user="'+o.user.screen_name+'"><span class="auth"><img src="'+o.user.profile_image_url+'" /><a class="former" href="http://fanfou.com/'+o.user.id+'">'+o.user.screen_name+'</a></span><p class="msg">'+o.text+'</p><p class="meta"><span class="reply-to">'+reply+'</span><span class="time">'+time+' from '+o.source+'</span><span class="act"><a href="###" class="reply">回复</a>|<a href="###" class="foward hidden">转发</a>|<a href="###" class="fav hidden">收藏</a></span></p></li>'
        }
        return str;
    }

	var creatList = function (obj, type){
		var typeStr = type?' '+type:'',
			str= (config.timeline=='insertafter')?'':'<ul id="actived" class="msg-list'+ typeStr +'">';
		if (obj.length == 0){
			str += '<li class="s-msg newbie">跟朋友聊聊去吧,<br />宅电脑前可找不到妹子</li>';
		}else if(obj.error){
			str += '<li class="s-msg error">'+obj.error+'</li>';
		}else{
            str += returnMsgList(obj);
		}
        str+=(config.timeline=='insertafter')?'':'</ul>';
		var actived = document.getElementById('actived');
		if (config.timeline == 'insertafter') {
        //    console.log(actived);
			actived.innerHTML += str;
				config.timeline = '';
		}else{
            if (actived) {
                actived.setAttribute('id','');
                actived.setAttribute('class', actived.getAttribute('class')+' hidden');
            }
			document.body.innerHTML += str;
		}
	}

	var switchTimeline = function(dir){
		document.getElementById('J_nav').getElementsByTagName('a')[config.defaultOrder].setAttribute('class','');
		if (dir) {
			if (dir == 'right') {
				if (config.defaultOrder+1 == config.typeArr.length) {
					config.defaultOrder = 0;
				}else {
					config.defaultOrder++;
				}
			}else if(dir == 'left') {
				if (config.defaultOrder == 0) {
					config.defaultOrder = config.typeArr.length -1;
				}else {
					config.defaultOrder--;
				}
			}
		}

		if (typeof(dir) == 'number') {
			var i = dir;
			config.defaultOrder = dir;
		}else {
			var i = config.defaultOrder;
		}

		var req = new sendReq({
			url : config.urlArr[i],
			type : config.typeArr[i]
		});
		document.getElementById('J_nav').getElementsByTagName('a')[config.defaultOrder].setAttribute('class','active');
	}

	var createNav = function() {
		var urlArr = config.urlArr,
			nav = document.getElementById('J_nav');
		for(var i=0,leng=urlArr.length; i<leng; i++) {
			var a = document.createElement('a');
			a.href=urlArr[i];
			a.setAttribute('data-type', config.typeArr[i]);
			a.setAttribute('data-order', i);
			a.innerHTML='&#8226;';
		//	a.setAttribute('class', config.typeArr[i]);
			nav.appendChild(a);
		}
		document.onmouseover = function(e){
			var el = e.target;
			if (el.parentNode.id == 'J_nav') {
				el.innerText = el.getAttribute('data-type');
				el.onmouseout = function(){
					el.innerHTML = '&#8226;';
				}
				el.onclick = function(){
					switchTimeline(parseInt(this.getAttribute('data-order'),10));
				}
			}
		}
	}

	var globalMsg = function(msg, style, live){
		var def_msg = '白白胖胖爱吃饭', 
			g_msg = document.getElementById('global_msg');
		g_msg.innerText = msg;
		g_msg.setAttribute('class', style);
        if (live == true) return;
		setTimeout(function(){
			g_msg.innerText = def_msg;
			g_msg.setAttribute('class', '');
		}, 3000);
	}

	var sendStatus = function(){
		var _msg = document.getElementById('J_status').value;
		if (!_msg) {
			globalMsg('吭爹呐, 写几个字再发好咩?', 'error');
			config.isType = null;
		}else {
			var req = new sendReq({
				url : config.API + 'statuses/update.json',
				type : 'update',
				msg : 'status='+_msg,
				fn : function(){
					switchTimeline(0);
					var del = document.getElementById('J_update');
                    del.parentNode.style.display ='none';
					globalMsg('厨房已收到饭桶的菜单!', 'ok');
					config.isType = null;
				}
			});
		}
	}
	var showStatusForm = function(id,msg) {
        if(document.getElementById('J_update')) {
            document.getElementById('J_update').parentNode.style.display = '';
        }else {
            var pop = document.createElement('div');
            pop.setAttribute('class', 'pop-mask');
            pop.innerHTML = '<div id="J_update" class="status-update"><p class="fun">"老板, 来碗新鲜白米饭!"</p><textarea id="J_status"></textarea><p class="act"><button onclick="sendStatus()" id="J_send"><span>谢谢, 不用别的菜了,白饭就好</span></button></p></div><a href="###" class="close">x</a>';
            document.body.appendChild(pop);
            document.getElementById('J_send').onclick = sendStatus;
        }
        document.getElementById('J_status').focus();
        document.getElementById('J_update').nextSibling.onclick = function(e){
            this.parentNode.style.display='none';
            config.isType = null;
        }
        if (msg) {
            document.getElementById('J_status').innerText=msg;
        }else {
            document.getElementById('J_status').innerText='';
        }
        config.isType = true;
	}

	var verify = function() {
		if (config.username=='' ||config.password=='' ) {
			window.location.href = 'options.html';
		}else {
        /* 饭否君的验证貌似没启来
			sendReq({
				url : config.API+'account/verify_credentials.json',
				fn : function(o) {
					console.log(o);
				}
			});
		*/
		}
	}
    var keybind = function() {
        window.onkeyup = function(e,i){
            if (config.isType !== null)  return;
            if(e.keyCode == 39) {
                switchTimeline('right');
            }else if(e.keyCode == 37) {
                switchTimeline('left');
            }else if(e.keyCode == 78) { // press n to create new msg form
                showStatusForm();
            }else if(e.keyCode == 27 || e.keyCode == 82) {
                e.stopPropagation();
                if (config.isType == true ) {
                    var pop = document.getElementById('J_update');
                    pop.parentNode.removeChild(pop);
                    config.isType = false;
                }else {
                    switchTimeline();
                }
            }else if(e.keyCode == 32) {
                config.timeline = 'insertafter';
        //			config.prototype.t.page = 2;

                sendReq({url : config.urlArr[config.defaultOrder]+'&page='+config.pageArr[config.defaultOrder]});	
            }
            config.pageArr[config.defaultOrder]++;
        }
    
    }

    var getNewTimeline = function() {
        var timer = config.timer;
        var fn = function() {
            console.log(config.sid);
            var req = new sendReq({
                url : config.urlArr[0],
                type : config.typeArr[0],
                sid : config.sid,
                fn : function (o) {
                    if (o.length == 0) return;
                    if(config.defaultOrder == 0) {
                        config.timeline = 'insertfbefore';
                        var newStr = returnMsgList(o, 'unread'),
                            homeLine = document.getElementById('actived'),
                            oldStr = homeLine.innerHTML;

                        homeLine.innerHTML = newStr + oldStr;
                        var unread = document.getElementsByClassName('unread');
                        for (var i=0, leng=unread.length; i<leng; i++) {
                            unread[i].onmouseover = function() {
                                this.setAttribute('class', '');
                            }
                        }
                    }else{
                        console.log(o);
                        globalMsg('还有'+o.length+'碗新鲜白米饭可以看看唷', 'ok');
                    }
                    
                }
            });
        }
        var loop = setInterval(fn, timer*500);
      //  var loop = setInterval(fn, timer*1000*60);

    }
