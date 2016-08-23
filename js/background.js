// 全局变量
var gRequest = [],
    reqResult = {},
    serverAddress = '', // 服务器地址
    clientNo = ''; // 客户端唯一标识

// urls  过滤网址 所有：<all_urls>  
// types 过滤类型 "main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"
var filter = {
	urls:[],
    types: ["main_frame", "sub_frame", "xmlhttprequest"]
};

localStorage.setItem('isOpen', 0);

// 获取请求中的参数
var callRequest = function(details)
{
    var requestId = Number(details.requestId);
    if(typeof(gRequest[requestId]) == 'undefined')
    {
        gRequest[requestId] = {
            method: details.method,
            url: details.url,
            client_no: clientNo,
            data: '',
            cookie: '',
            user_agent: '',
            referer: ''
        };
    }
    if(details.method == 'POST'){
        if(typeof(details.requestBody) != 'undefined'){
            var params = getParams(details.requestBody);
            gRequest[requestId].data = params ? params : '';
        }
    }
};

// 获取请求中的Headers
var callReqGetCookie = function(details)
{
    var requestId = Number(details.requestId);
    if(typeof(gRequest[requestId]) == 'undefined')
    {
        gRequest[requestId] = {
            method: details.method,
            url: details.url,
            client_no: clientNo,
            data: '',
            cookie: '',
            user_agent: '',
            referer: ''
        };
    }

    if(details.method == 'GET')
    {
        //如果一个get提交的url都没有参数，那么就直接终止程序。
        var index = details.url.indexOf('?');
        if(index == -1){
            return;
        }else{
            var getParam = details.url.substr(index+1);
            if(getParam == ''){
                return;
            }
        }
    }

    var headers = {},
        total = details.requestHeaders.length;

    for(var i = 0; i<total; i++){
        headers[details.requestHeaders[i].name] = details.requestHeaders[i].value;
    }
    if(typeof(headers.Cookie) != 'undefined'){
        gRequest[requestId].cookie = headers.Cookie;
        delete headers.Cookie;
    }
    if(typeof(headers['User-Agent']) != 'undefined'){
        gRequest[requestId].user_agent = headers['User-Agent'];
        delete headers['User-Agent'];
    }
    if(typeof(headers['Referer']) != 'undefined'){
        gRequest[requestId].referer = headers['Referer'];
        delete headers['Referer'];
    }
    gRequest[requestId].headers = JSON.stringify(headers);

    // 发送最后json reqResult对象给api
	sendPost('http://' + serverAddress + '/task/add', gRequest[requestId]);
};

// Popup页面消息回调
function getPopupMessage(request, sender, sendResponse)
{
	// 得到Popup.js的开关信息后，可以把值设置到一个全局变量上，callRequest函数里面判断这个值即可。
	var isOpen = Number(request.isOpen);

	if( isOpen )
	{
        // 设置服务器地址  客户端唯一标识
        serverAddress = request.server_address;
        clientNo = request.client_no;

        // 白名单设置
        var whites = [],
            hostList = request.hostList;

		//处理每一个域名，改为标准的过滤表达式 如*://w.com/*
		for(var i in hostList)
		{
			//如果加了http://或者https://协议头，去掉协议头，改为*：//+domain
			if(hostList[i].substr(4,3)=='://' || hostList[i].substr(5,3)=="://"){
				var temp = hostList[i];
				index = temp.indexOf('://');
				domain = temp.substr(index+3);
				hostList[i] = "*://"+domain;
			}else{
				hostList[i] = '*://' + hostList[i]; // 如果没有加协议头，直接添加*://+domain
			}
			// 如果最后一位是/，比如http://w.com/,则直接最末尾添加*，如果不是则添加/*
			// 最后整理出chrome的标准的表达式是：*://w.com/*
			if(hostList[i].substr(hostList[i].length-1) == '/'){
				hostList[i] += '*';
			}
			else{
				hostList[i] += '/*';
			}
			whites.push(hostList[i]);
		}
		// console.log(whites); //打印白名单列表
		filter.urls = whites;
	}
	
	// 插件的开关
	listener(isOpen);
}

// 插件的所有动作都以消息回调来驱动
chrome.extension.onMessage.addListener(getPopupMessage); // 监听消息

// 插件的开关
function listener(isOpen)
{
	if(isOpen){
        // 开启监听
		chrome.webRequest.onBeforeRequest.addListener(callRequest, filter, ["blocking", "requestBody"]);
        chrome.webRequest.onBeforeSendHeaders.addListener(callReqGetCookie, filter, ['blocking', 'requestHeaders']);
    }else{
		// 取消监听
		chrome.webRequest.onBeforeRequest.removeListener(callRequest);
		chrome.webRequest.onBeforeSendHeaders.removeListener(callReqGetCookie);
	}
}

// Send Request
function sendPost(url, params)
{
    console.log(params);
    if(url && typeof(params) != 'undefined')
    {
        var reqParams = [];
        for(var key in params){
            reqParams.push(key + '=' + params[key]);
        }

        xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        // xhr.setRequestHeader("Content-type", "application/json");
        xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        xhr.send(reqParams.join('&'));
    }
}

// 处理POST请求参数
function getParams(params)
{
    if(typeof(params) != 'undefined')
    {
        // POST请求存在多种形式包括：rawData(原始数据) formData(常见Key=Value形式) 等等
        if(typeof(params.formData) == 'object') {
            var formData = params.formData;
            var result = [];
            for(var key in formData)
                result.push( key + '=' + formData[key] );
            return encodeURIComponent(result.join('&'));
        }
        else if(typeof(params.raw) == 'object') {
            var raw = params.raw; // 原始数据，暂不处理
            return encodeURIComponent(raw);
        }
    }
	return false;
}
